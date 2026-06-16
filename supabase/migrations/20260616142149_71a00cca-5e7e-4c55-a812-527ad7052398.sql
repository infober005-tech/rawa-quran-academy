
-- 1) payment method enum
DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('edahabia', 'baridimob');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method NOT NULL DEFAULT 'edahabia';

-- 2) track reminders already sent
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS reminders_sent jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 3) reminder + expiry job
CREATE OR REPLACE FUNCTION public.process_subscription_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  days_left int;
  bucket text;
  title text;
  body text;
BEGIN
  -- Expire ended subscriptions
  UPDATE public.subscriptions
     SET status = 'expired', updated_at = now()
   WHERE status = 'active' AND end_date < now();

  -- Notify the just-expired ones (bucket = 'expired')
  FOR r IN
    SELECT * FROM public.subscriptions
    WHERE status = 'expired'
      AND end_date >= now() - interval '1 day'
      AND NOT (reminders_sent ? 'expired')
  LOOP
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (r.student_id, '⛔ انتهى اشتراكك', 'انتهت صلاحية اشتراكك. يرجى التجديد لمتابعة الاستفادة من المنصة.', '/subscribe');
    UPDATE public.subscriptions SET reminders_sent = reminders_sent || '["expired"]'::jsonb WHERE id = r.id;
  END LOOP;

  -- Pre-expiry reminders: 7d, 3d, 1d
  FOR r IN
    SELECT *, GREATEST(0, CEIL(EXTRACT(EPOCH FROM (end_date - now())) / 86400))::int AS dl
    FROM public.subscriptions
    WHERE status = 'active'
      AND end_date BETWEEN now() AND now() + interval '8 days'
  LOOP
    days_left := r.dl;
    IF days_left = 7 THEN bucket := 'd7';
    ELSIF days_left = 3 THEN bucket := 'd3';
    ELSIF days_left = 1 THEN bucket := 'd1';
    ELSE bucket := NULL;
    END IF;

    IF bucket IS NOT NULL AND NOT (r.reminders_sent ? bucket) THEN
      title := '⏳ تذكير: اشتراكك ينتهي خلال ' || days_left || ' ' ||
               CASE WHEN days_left = 1 THEN 'يوم' ELSE 'أيام' END;
      body  := 'سيتم تعطيل وصولك إلى المنصة عند انتهاء اشتراكك. يمكنك التجديد الآن لتجنب الانقطاع.';
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (r.student_id, title, body, '/subscribe');
      UPDATE public.subscriptions
         SET reminders_sent = reminders_sent || to_jsonb(ARRAY[bucket])
       WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- 4) Schedule daily at 08:00 UTC (09:00 Algeria)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('subscription-reminders-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'subscription-reminders-daily',
  '0 8 * * *',
  $cron$ SELECT public.process_subscription_reminders(); $cron$
);
