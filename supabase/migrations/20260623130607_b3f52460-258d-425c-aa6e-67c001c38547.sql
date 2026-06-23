
-- 1. QR + fraud fields on payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_ref text,
  ADD COLUMN IF NOT EXISTS qr_token text,
  ADD COLUMN IF NOT EXISTS qr_payload jsonb,
  ADD COLUMN IF NOT EXISTS qr_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_sha256 text,
  ADD COLUMN IF NOT EXISTS client_ip text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_payment_ref_unique ON public.payments (payment_ref) WHERE payment_ref IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payments_receipt_sha_unique ON public.payments (receipt_sha256) WHERE receipt_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments (created_at DESC);

-- 2. Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_director_read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "audit_self_insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(), 'director'::app_role));
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs (actor_id, created_at DESC);

-- 3. Rate-limit RPC: prevent more than 1 payment attempt per student per 60s
CREATE OR REPLACE FUNCTION public.can_submit_payment(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = _user_id
      AND created_at > now() - interval '60 seconds'
  );
$$;

-- 4. Audit trigger for payments
CREATE OR REPLACE FUNCTION public.audit_payment_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, metadata)
    VALUES (NEW.student_id, 'payment', NEW.id, 'submitted',
      jsonb_build_object('amount', NEW.amount, 'ref', NEW.payment_ref, 'method', NEW.payment_method));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, metadata)
    VALUES (COALESCE(NEW.reviewed_by, auth.uid()), 'payment', NEW.id, 'status_changed',
      jsonb_build_object('from', OLD.status, 'to', NEW.status, 'notes', NEW.admin_notes));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS payments_audit_trg ON public.payments;
CREATE TRIGGER payments_audit_trg AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_payment_changes();

-- 5. Realtime for payments + subscriptions (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
