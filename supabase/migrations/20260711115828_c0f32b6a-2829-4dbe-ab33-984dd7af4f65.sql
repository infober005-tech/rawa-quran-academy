
-- 1) Halaqas: block non-directors from mutating sensitive columns
CREATE OR REPLACE FUNCTION public.prevent_non_director_halaqa_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

DROP TRIGGER IF EXISTS halaqas_restrict_field_changes ON public.halaqas;
CREATE TRIGGER halaqas_restrict_field_changes
BEFORE UPDATE ON public.halaqas
FOR EACH ROW EXECUTE FUNCTION public.prevent_non_director_halaqa_field_changes();

-- 2) Remove payments from realtime publication to avoid broadcasting PII
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.payments';
  END IF;
END $$;

-- 3) Storage: mirror INSERT ownership checks for UPDATE and DELETE on halaqa buckets

-- quran-audio
DROP POLICY IF EXISTS quran_audio_update ON storage.objects;
CREATE POLICY quran_audio_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'quran-audio' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (private.has_role(auth.uid(), 'teacher'::app_role)
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
)
WITH CHECK (
  bucket_id = 'quran-audio' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (private.has_role(auth.uid(), 'teacher'::app_role)
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

DROP POLICY IF EXISTS quran_audio_delete_scoped ON storage.objects;
CREATE POLICY quran_audio_delete_scoped ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'quran-audio' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (private.has_role(auth.uid(), 'teacher'::app_role)
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

-- documents
DROP POLICY IF EXISTS documents_update ON storage.objects;
CREATE POLICY documents_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
)
WITH CHECK (
  bucket_id = 'documents' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

DROP POLICY IF EXISTS documents_delete_scoped ON storage.objects;
CREATE POLICY documents_delete_scoped ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

-- assignments
DROP POLICY IF EXISTS assignments_bucket_update ON storage.objects;
CREATE POLICY assignments_bucket_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'assignments' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (private.has_role(auth.uid(), 'teacher'::app_role)
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
)
WITH CHECK (
  bucket_id = 'assignments' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (private.has_role(auth.uid(), 'teacher'::app_role)
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

DROP POLICY IF EXISTS assignments_bucket_delete_scoped ON storage.objects;
CREATE POLICY assignments_bucket_delete_scoped ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'assignments' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (private.has_role(auth.uid(), 'teacher'::app_role)
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

-- halaqa-files
DROP POLICY IF EXISTS halaqa_files_update ON storage.objects;
CREATE POLICY halaqa_files_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'halaqa-files' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
)
WITH CHECK (
  bucket_id = 'halaqa-files' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

DROP POLICY IF EXISTS halaqa_files_delete_scoped ON storage.objects;
CREATE POLICY halaqa_files_delete_scoped ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'halaqa-files' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

-- recordings
DROP POLICY IF EXISTS "recordings update" ON storage.objects;
CREATE POLICY "recordings update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'recordings' AND owner = auth.uid() AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
)
WITH CHECK (
  bucket_id = 'recordings' AND owner = auth.uid() AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);

DROP POLICY IF EXISTS "recordings delete scoped" ON storage.objects;
CREATE POLICY "recordings delete scoped" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'recordings' AND (
    private.has_role(auth.uid(), 'director'::app_role)
    OR private.has_role(auth.uid(), 'general_supervisor'::app_role)
    OR (owner = auth.uid()
        AND (private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role))
        AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))
  )
);
