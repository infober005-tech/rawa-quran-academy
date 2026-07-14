CREATE OR REPLACE FUNCTION public.prevent_non_director_halaqa_field_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role / system context (e.g. cascaded SET NULL from auth user deletion)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF private.has_role(auth.uid(), 'director'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.teacher_id IS DISTINCT FROM OLD.teacher_id
     OR NEW.supervisor_id IS DISTINCT FROM OLD.supervisor_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.gender IS DISTINCT FROM OLD.gender THEN
    RAISE EXCEPTION 'Only directors can change halaqa assignments, status or gender';
  END IF;

  RETURN NEW;
END;
$function$;