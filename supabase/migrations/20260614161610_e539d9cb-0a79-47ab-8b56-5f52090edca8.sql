
-- Payment status enums
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'expired', 'rejected', 'cancelled');

-- Settings (singleton)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_name_ar text NOT NULL DEFAULT 'اشتراك رواء',
  subscription_name_fr text NOT NULL DEFAULT 'Abonnement Rawa',
  subscription_name_en text NOT NULL DEFAULT 'Rawa Subscription',
  description_ar text NOT NULL DEFAULT 'اشتراك كامل في منصة رواء لتعليم القرآن الكريم وعلومه.',
  description_fr text NOT NULL DEFAULT 'Abonnement complet à la plateforme Rawa.',
  description_en text NOT NULL DEFAULT 'Full access to the Rawa Quran Academy.',
  price_dzd numeric(10,2) NOT NULL DEFAULT 3000,
  currency text NOT NULL DEFAULT 'DZD',
  ccp_number text NOT NULL DEFAULT '',
  ccp_key text,
  account_holder text NOT NULL DEFAULT '',
  rip_number text,
  qr_code_url text,
  subscription_duration_days int NOT NULL DEFAULT 30,
  benefits_ar jsonb NOT NULL DEFAULT '["حضور الحلقات المباشرة","تصحيح التلاوة","متابعة الحفظ","تقييمات دورية","تقارير للطالب وولي الأمر","المشاركة في الدورات والفعاليات","الوصول الكامل للمنصة"]'::jsonb,
  benefits_fr jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_all_auth" ON public.payment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_director_write" ON public.payment_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'director')) WITH CHECK (public.has_role(auth.uid(),'director'));
CREATE TRIGGER payment_settings_updated BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.payment_settings (ccp_number, account_holder) VALUES ('0000000000000000', 'Rawa Quran Academy');

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  amount numeric(10,2) NOT NULL,
  transaction_number text NOT NULL,
  payment_date date NOT NULL,
  receipt_file_url text NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_student_idx ON public.payments(student_id);
CREATE INDEX payments_status_idx ON public.payments(status);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_student_select_own" ON public.payments FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.has_role(auth.uid(),'director') OR public.is_parent_of(auth.uid(), student_id));
CREATE POLICY "payments_student_insert_own" ON public.payments FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "payments_director_update" ON public.payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'director')) WITH CHECK (public.has_role(auth.uid(),'director'));
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_student_idx ON public.subscriptions(student_id);
CREATE UNIQUE INDEX subscriptions_one_active ON public.subscriptions(student_id) WHERE status = 'active';
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select_own_or_director_or_parent" ON public.subscriptions FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.has_role(auth.uid(),'director') OR public.is_parent_of(auth.uid(), student_id));
CREATE POLICY "subs_director_all" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'director')) WITH CHECK (public.has_role(auth.uid(),'director'));
CREATE TRIGGER subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Has active subscription helper
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE student_id = _user_id
      AND status = 'active'
      AND end_date >= now()
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- Payment lifecycle trigger
CREATE OR REPLACE FUNCTION public.handle_payment_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_duration int;
  v_existing public.subscriptions%ROWTYPE;
  v_start timestamptz;
  v_end timestamptz;
  r record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR r IN SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'director' LOOP
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (r.user_id, 'طلب دفع جديد', 'تم استلام طلب اشتراك جديد من ' || NEW.full_name, '/admin');
    END LOOP;
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (NEW.student_id, 'تم إرسال طلب الدفع', 'سيتم مراجعة العملية من طرف الإدارة.', '/subscribe');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      SELECT subscription_duration_days INTO v_duration FROM public.payment_settings LIMIT 1;
      v_duration := COALESCE(v_duration, 30);
      SELECT * INTO v_existing FROM public.subscriptions WHERE student_id = NEW.student_id AND status = 'active' LIMIT 1;
      v_start := now();
      IF v_existing.id IS NOT NULL AND v_existing.end_date > now() THEN
        v_start := v_existing.end_date;
        v_end := v_start + (v_duration || ' days')::interval;
        UPDATE public.subscriptions SET end_date = v_end, payment_id = NEW.id, updated_at = now() WHERE id = v_existing.id;
      ELSE
        v_end := v_start + (v_duration || ' days')::interval;
        IF v_existing.id IS NOT NULL THEN
          UPDATE public.subscriptions SET status = 'expired' WHERE id = v_existing.id;
        END IF;
        INSERT INTO public.subscriptions (student_id, payment_id, status, start_date, end_date)
        VALUES (NEW.student_id, NEW.id, 'active', v_start, v_end);
      END IF;
      NEW.approved_at := now();
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.student_id, 'تمت الموافقة على الدفع', 'تمت الموافقة على عملية الدفع وتفعيل اشتراكك بنجاح.', '/dashboard');
    ELSIF NEW.status = 'rejected' THEN
      NEW.rejected_at := now();
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.student_id, 'تم رفض الدفع', COALESCE('تم رفض عملية الدفع. ' || NEW.admin_notes, 'تم رفض عملية الدفع. يرجى مراجعة الإدارة.'), '/subscribe');
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER payments_after_insert AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_payment_status_change();
CREATE TRIGGER payments_before_status_update BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_payment_status_change();
