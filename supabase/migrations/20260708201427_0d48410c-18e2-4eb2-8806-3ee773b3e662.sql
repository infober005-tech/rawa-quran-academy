
-- Helper: teacher owns halaqa (SECURITY DEFINER, avoids RLS recursion)
CREATE OR REPLACE FUNCTION private.teacher_owns_halaqa(halaqa_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas h
    WHERE h.id = halaqa_uuid
      AND h.teacher_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION private.teacher_owns_halaqa(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.teacher_owns_halaqa(uuid) TO authenticated;

-- Teacher policies on attendance (SELECT / INSERT / UPDATE by halaqa ownership)
DROP POLICY IF EXISTS "Teacher reads attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teacher records attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teacher updates attendance" ON public.attendance;

CREATE POLICY "Teacher reads attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (private.teacher_owns_halaqa(halaqa_id));

CREATE POLICY "Teacher records attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (private.teacher_owns_halaqa(halaqa_id));

CREATE POLICY "Teacher updates attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (private.teacher_owns_halaqa(halaqa_id))
WITH CHECK (private.teacher_owns_halaqa(halaqa_id));
