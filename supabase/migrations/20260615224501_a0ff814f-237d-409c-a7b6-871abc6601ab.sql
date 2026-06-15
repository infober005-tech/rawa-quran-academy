
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1) Fix broken assignments SELECT policy (self-reference bug)
DROP POLICY IF EXISTS "Student reads own assignments" ON public.assignments;
CREATE POLICY "Student reads own assignments" ON public.assignments
FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR (halaqa_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.student_halaqas sh
    WHERE sh.halaqa_id = assignments.halaqa_id
      AND sh.student_id = auth.uid()
  ))
);

-- 2) Storage RLS for previously unprotected private buckets
--    Layout convention: first folder segment = halaqa_id (or user_id for submissions)

-- quran-audio: directors/general supervisors/teachers upload; halaqa members read
DROP POLICY IF EXISTS "quran_audio_read" ON storage.objects;
CREATE POLICY "quran_audio_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'quran-audio' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);
DROP POLICY IF EXISTS "quran_audio_write" ON storage.objects;
CREATE POLICY "quran_audio_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'quran-audio' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'teacher')
  )
);
DROP POLICY IF EXISTS "quran_audio_delete" ON storage.objects;
CREATE POLICY "quran_audio_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'quran-audio' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR owner = auth.uid()
  )
);

-- documents: halaqa-scoped documents (first folder = halaqa_id)
DROP POLICY IF EXISTS "documents_read" ON storage.objects;
CREATE POLICY "documents_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);
DROP POLICY IF EXISTS "documents_write" ON storage.objects;
CREATE POLICY "documents_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'halaqa_supervisor')
  )
);
DROP POLICY IF EXISTS "documents_delete" ON storage.objects;
CREATE POLICY "documents_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR owner = auth.uid()
  )
);

-- assignments bucket: teacher uploads (first folder = halaqa_id), halaqa members read
DROP POLICY IF EXISTS "assignments_bucket_read" ON storage.objects;
CREATE POLICY "assignments_bucket_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'assignments' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);
DROP POLICY IF EXISTS "assignments_bucket_write" ON storage.objects;
CREATE POLICY "assignments_bucket_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assignments' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'teacher')
  )
);
DROP POLICY IF EXISTS "assignments_bucket_delete" ON storage.objects;
CREATE POLICY "assignments_bucket_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'assignments' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR owner = auth.uid()
  )
);

-- student-submissions: first folder = student auth.uid()
DROP POLICY IF EXISTS "submissions_read" ON storage.objects;
CREATE POLICY "submissions_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'student-submissions' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'halaqa_supervisor')
    OR public.is_parent_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);
DROP POLICY IF EXISTS "submissions_write" ON storage.objects;
CREATE POLICY "submissions_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-submissions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "submissions_update" ON storage.objects;
CREATE POLICY "submissions_update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'student-submissions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "submissions_delete" ON storage.objects;
CREATE POLICY "submissions_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'student-submissions' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'director')
  )
);

-- halaqa-files: first folder = halaqa_id
DROP POLICY IF EXISTS "halaqa_files_read" ON storage.objects;
CREATE POLICY "halaqa_files_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'halaqa-files' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);
DROP POLICY IF EXISTS "halaqa_files_write" ON storage.objects;
CREATE POLICY "halaqa_files_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'halaqa-files' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'halaqa_supervisor')
  )
);
DROP POLICY IF EXISTS "halaqa_files_delete" ON storage.objects;
CREATE POLICY "halaqa_files_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'halaqa-files' AND (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR owner = auth.uid()
  )
);

-- 3) Realtime channel authorization
-- We only use postgres_changes (row-level RLS on source tables applies).
-- Deny all Broadcast/Presence access to prevent future misuse.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "deny_broadcast_all" ON realtime.messages';
    EXECUTE 'CREATE POLICY "deny_broadcast_all" ON realtime.messages FOR ALL TO authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;
