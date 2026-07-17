
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS phone_country text,
  ADD COLUMN IF NOT EXISTS phone_code text,
  ADD COLUMN IF NOT EXISTS phone_number text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, gender, age, country, city,
    quran_level, preferred_schedule, parent_name, language,
    date_of_birth, state, phone_country, phone_code, phone_number
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NULLIF(NEW.raw_user_meta_data->>'gender','')::public.gender_type,
    NULLIF(NEW.raw_user_meta_data->>'age','')::INT,
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'city',
    NULLIF(NEW.raw_user_meta_data->>'quran_level','')::public.quran_level,
    NEW.raw_user_meta_data->>'preferred_schedule',
    NEW.raw_user_meta_data->>'parent_name',
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'language','')::public.app_language, 'ar'),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth','')::date,
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'phone_country',
    NEW.raw_user_meta_data->>'phone_code',
    NEW.raw_user_meta_data->>'phone_number'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $function$;
