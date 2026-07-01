
CREATE OR REPLACE FUNCTION public.notify_halaqa_activated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record;
BEGIN
  IF NEW.status IN ('active','published') AND (
      TG_OP = 'INSERT'
      OR OLD.status IS DISTINCT FROM NEW.status
    ) THEN
    IF NEW.teacher_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.teacher_id, 'حلقة جديدة: ' || NEW.name, 'تم تعيينك في حلقة', '/halaqas');
    END IF;
    IF NEW.supervisor_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.supervisor_id, 'حلقة جديدة: ' || NEW.name, 'تم تعيينك مشرفاً للحلقة', '/halaqas');
    END IF;
    FOR r IN
      SELECT p.id FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
      WHERE p.gender = NEW.gender AND p.status = 'approved'
    LOOP
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (r.id, 'حلقة جديدة متاحة: ' || NEW.name, COALESCE(NEW.description, ''), '/halaqas');
    END LOOP;
  END IF;
  RETURN NEW;
END $function$;
