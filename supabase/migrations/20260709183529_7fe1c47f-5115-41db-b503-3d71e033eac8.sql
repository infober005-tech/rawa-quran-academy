
CREATE OR REPLACE FUNCTION private.teaches_halaqa(_user_id uuid, _halaqa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas
    WHERE id = _halaqa_id
      AND (teacher_id = _user_id OR supervisor_id = _user_id)
  );
$$;

-- quran-audio
DROP POLICY IF EXISTS quran_audio_write ON storage.objects;
CREATE POLICY quran_audio_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'quran-audio'
  AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (
      private.has_role(auth.uid(), 'teacher'::app_role)
      AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

-- documents
DROP POLICY IF EXISTS documents_write ON storage.objects;
CREATE POLICY documents_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (
      (private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
      AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

-- assignments
DROP POLICY IF EXISTS assignments_bucket_write ON storage.objects;
CREATE POLICY assignments_bucket_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assignments'
  AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (
      private.has_role(auth.uid(), 'teacher'::app_role)
      AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

-- halaqa-files
DROP POLICY IF EXISTS halaqa_files_write ON storage.objects;
CREATE POLICY halaqa_files_write ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'halaqa-files'
  AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (
      (private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
      AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

-- recordings (policy name has a space)
DROP POLICY IF EXISTS "recordings write" ON storage.objects;
CREATE POLICY "recordings write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'recordings'
  AND owner = auth.uid()
  AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (
      (private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
      AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);
