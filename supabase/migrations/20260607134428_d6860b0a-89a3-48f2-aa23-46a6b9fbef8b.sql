
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('student','teacher','halaqa_supervisor','general_supervisor','director');
CREATE TYPE public.gender_type AS ENUM ('male','female');
CREATE TYPE public.quran_level AS ENUM ('beginner','intermediate','advanced');
CREATE TYPE public.student_status AS ENUM ('pending_review','approved','rejected','suspended');
CREATE TYPE public.attendance_status AS ENUM ('present','absent','late');
CREATE TYPE public.halaqa_status AS ENUM ('active','archived');
CREATE TYPE public.app_language AS ENUM ('ar','fr','en');

-- =========================================================
-- updated_at helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  parent_name TEXT,
  email TEXT,
  phone TEXT,
  gender public.gender_type,
  age INT CHECK (age IS NULL OR (age > 2 AND age < 120)),
  country TEXT,
  city TEXT,
  quran_level public.quran_level,
  preferred_schedule TEXT,
  status public.student_status NOT NULL DEFAULT 'pending_review',
  language public.app_language NOT NULL DEFAULT 'ar',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- USER ROLES (separate table — never on profiles)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper (SECURITY DEFINER — bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Convenience: get the "highest" role for a user (director > general_supervisor > halaqa_supervisor > teacher > student)
CREATE OR REPLACE FUNCTION public.primary_role(_user_id UUID)
RETURNS public.app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'director' THEN 1
    WHEN 'general_supervisor' THEN 2
    WHEN 'halaqa_supervisor' THEN 3
    WHEN 'teacher' THEN 4
    WHEN 'student' THEN 5
  END
  LIMIT 1;
$$;

-- Profiles RLS
CREATE POLICY "Users read their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Staff read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
    OR public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'halaqa_supervisor')
  );
CREATE POLICY "Users update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Director updates any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Director inserts profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Director deletes profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'director'));

-- user_roles RLS — read own roles, director manages all
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Director reads all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Director manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- =========================================================
-- Auto-create profile + assign student role on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, gender, age, country, city, quran_level, preferred_schedule, parent_name, language)
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
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'language','')::public.app_language, 'ar')
  );
  -- Everyone starts as student. Director can promote later.
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- HALAQAS
-- =========================================================
CREATE TABLE public.halaqas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender public.gender_type NOT NULL,
  level public.quran_level NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  schedule TEXT,
  meeting_link TEXT,
  description TEXT,
  status public.halaqa_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.halaqas TO authenticated;
GRANT ALL ON public.halaqas TO service_role;
ALTER TABLE public.halaqas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER halaqas_updated_at BEFORE UPDATE ON public.halaqas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Director manages halaqas" ON public.halaqas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Staff read all halaqas" ON public.halaqas
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'general_supervisor')
  );
CREATE POLICY "Teacher reads own halaqas" ON public.halaqas
  FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Supervisor reads own halaqas" ON public.halaqas
  FOR SELECT TO authenticated USING (supervisor_id = auth.uid());

-- =========================================================
-- STUDENT_HALAQAS (assignment)
-- =========================================================
CREATE TABLE public.student_halaqas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  halaqa_id UUID NOT NULL REFERENCES public.halaqas(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, halaqa_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_halaqas TO authenticated;
GRANT ALL ON public.student_halaqas TO service_role;
ALTER TABLE public.student_halaqas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director manages student_halaqas" ON public.student_halaqas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Student reads own assignment" ON public.student_halaqas
  FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Staff reads assignments" ON public.student_halaqas
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'general_supervisor')
    OR EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
  );

-- Helper: is the current user assigned to a halaqa as student/teacher/supervisor?
CREATE OR REPLACE FUNCTION public.in_halaqa(_user_id UUID, _halaqa_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas WHERE id = _halaqa_id AND (teacher_id = _user_id OR supervisor_id = _user_id)
  ) OR EXISTS (
    SELECT 1 FROM public.student_halaqas WHERE halaqa_id = _halaqa_id AND student_id = _user_id
  );
$$;

-- =========================================================
-- ATTENDANCE
-- =========================================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  halaqa_id UUID NOT NULL REFERENCES public.halaqas(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, halaqa_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director manages attendance" ON public.attendance
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Student reads own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Halaqa staff reads attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'general_supervisor')
    OR EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND (h.teacher_id = auth.uid() OR h.supervisor_id = auth.uid()))
  );
CREATE POLICY "Supervisor records attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND h.supervisor_id = auth.uid())
  );
CREATE POLICY "Supervisor updates attendance" ON public.attendance
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND h.supervisor_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND h.supervisor_id = auth.uid())
  );

-- =========================================================
-- EVALUATIONS
-- =========================================================
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  halaqa_id UUID REFERENCES public.halaqas(id) ON DELETE SET NULL,
  tajweed_score INT CHECK (tajweed_score BETWEEN 0 AND 100),
  memorization_score INT CHECK (memorization_score BETWEEN 0 AND 100),
  fluency_score INT CHECK (fluency_score BETWEEN 0 AND 100),
  participation_score INT CHECK (participation_score BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director manages evaluations" ON public.evaluations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Student reads own evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Teacher reads own evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "General supervisor reads evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'general_supervisor'));
CREATE POLICY "Teacher creates evaluations" ON public.evaluations
  FOR INSERT TO authenticated WITH CHECK (
    teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher')
  );
CREATE POLICY "Teacher updates own evaluations" ON public.evaluations
  FOR UPDATE TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

-- =========================================================
-- ASSIGNMENTS + SUBMISSIONS
-- =========================================================
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqa_id UUID REFERENCES public.halaqas(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director manages assignments" ON public.assignments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Teacher manages own assignments" ON public.assignments
  FOR ALL TO authenticated USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Student reads own assignments" ON public.assignments
  FOR SELECT TO authenticated USING (
    student_id = auth.uid()
    OR (halaqa_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.student_halaqas sh WHERE sh.halaqa_id = halaqa_id AND sh.student_id = auth.uid()
    ))
  );
CREATE POLICY "Supervisor reads halaqa assignments" ON public.assignments
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'general_supervisor')
    OR (halaqa_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.halaqas h WHERE h.id = halaqa_id AND h.supervisor_id = auth.uid()))
  );

CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student manages own submissions" ON public.assignment_submissions
  FOR ALL TO authenticated USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teacher reads submissions for own assignments" ON public.assignment_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
  );
CREATE POLICY "Director reads submissions" ON public.assignment_submissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'director'));

-- =========================================================
-- EVENTS
-- =========================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  cover_url TEXT,
  category TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads events" ON public.events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Director manages events" ON public.events
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "User updates own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Director manages notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- =========================================================
-- PARENT LINKS (optional parent access)
-- =========================================================
CREATE TABLE public.parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, student_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_links TO authenticated;
GRANT ALL ON public.parent_links TO service_role;
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent and student read link" ON public.parent_links
  FOR SELECT TO authenticated USING (parent_user_id = auth.uid() OR student_user_id = auth.uid());
CREATE POLICY "Director manages parent links" ON public.parent_links
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- Allow parent to read linked child's profile/attendance/evaluations/assignments via additive policies
CREATE POLICY "Parent reads child profile" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.parent_links p WHERE p.parent_user_id = auth.uid() AND p.student_user_id = id)
  );
CREATE POLICY "Parent reads child attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.parent_links p WHERE p.parent_user_id = auth.uid() AND p.student_user_id = student_id)
  );
CREATE POLICY "Parent reads child evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.parent_links p WHERE p.parent_user_id = auth.uid() AND p.student_user_id = student_id)
  );
CREATE POLICY "Parent reads child assignments" ON public.assignments
  FOR SELECT TO authenticated USING (
    student_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.parent_links p WHERE p.parent_user_id = auth.uid() AND p.student_user_id = student_id)
  );

-- =========================================================
-- GENDER SEPARATION ENFORCEMENT
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_halaqa_gender()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.gender_type;
BEGIN
  IF NEW.teacher_id IS NOT NULL THEN
    SELECT gender INTO g FROM public.profiles WHERE id = NEW.teacher_id;
    IF g IS NOT NULL AND g <> NEW.gender THEN
      RAISE EXCEPTION 'Teacher gender must match halaqa gender';
    END IF;
  END IF;
  IF NEW.supervisor_id IS NOT NULL THEN
    SELECT gender INTO g FROM public.profiles WHERE id = NEW.supervisor_id;
    IF g IS NOT NULL AND g <> NEW.gender THEN
      RAISE EXCEPTION 'Supervisor gender must match halaqa gender';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER halaqas_gender_check BEFORE INSERT OR UPDATE ON public.halaqas
  FOR EACH ROW EXECUTE FUNCTION public.enforce_halaqa_gender();

CREATE OR REPLACE FUNCTION public.enforce_student_halaqa_gender()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sg public.gender_type; hg public.gender_type;
BEGIN
  SELECT gender INTO sg FROM public.profiles WHERE id = NEW.student_id;
  SELECT gender INTO hg FROM public.halaqas WHERE id = NEW.halaqa_id;
  IF sg IS NOT NULL AND hg IS NOT NULL AND sg <> hg THEN
    RAISE EXCEPTION 'Student gender must match halaqa gender';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER student_halaqas_gender_check BEFORE INSERT OR UPDATE ON public.student_halaqas
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_halaqa_gender();
