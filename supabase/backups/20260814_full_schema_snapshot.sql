-- ============================================
-- Rawa Quran Academy — full schema snapshot
-- generated: Fri Aug 14 15:23:14 UTC 2026
-- ============================================

-- ---------- SCHEMAS ----------
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS public;

-- ---------- ENUM TYPES ----------
CREATE TYPE public.app_language AS ENUM ('ar', 'fr', 'en');
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'halaqa_supervisor', 'general_supervisor', 'director', 'parent');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.conversation_kind AS ENUM ('direct', 'group', 'halaqa');
CREATE TYPE public.gender_type AS ENUM ('male', 'female');
CREATE TYPE public.halaqa_status AS ENUM ('active', 'archived', 'inactive', 'draft', 'published');
CREATE TYPE public.payment_method AS ENUM ('edahabia', 'baridimob');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.quran_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.student_status AS ENUM ('pending_review', 'approved', 'rejected', 'suspended');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'expired', 'rejected', 'cancelled');
CREATE TYPE public.supervisor_note_category AS ENUM ('behavior', 'attendance', 'technical', 'follow_up');

-- ---------- TABLES ----------
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  assignment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  file_url text,
  notes text,
  submitted_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  halaqa_id uuid,
  teacher_id uuid NOT NULL,
  student_id uuid,
  title text NOT NULL,
  description text,
  due_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_id uuid NOT NULL,
  halaqa_id uuid NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  status attendance_status NOT NULL,
  notes text,
  recorded_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  session_id uuid,
  checked_in_at timestamp with time zone,
  device_info jsonb,
  user_agent text,
  ip_address text,
  latitude double precision,
  longitude double precision,
  is_manual boolean DEFAULT false NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  halaqa_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  token text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  ended_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamp with time zone DEFAULT now() NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  kind conversation_kind DEFAULT 'direct'::conversation_kind NOT NULL,
  title text,
  halaqa_id uuid,
  created_by uuid,
  last_message_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  halaqa_id uuid,
  tajweed_score integer,
  memorization_score integer,
  fluency_score integer,
  participation_score integer,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  session_id uuid,
  behavior_score integer
);
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  registered_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  description text,
  date timestamp with time zone NOT NULL,
  meeting_link text,
  cover_url text,
  category text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  event_type text,
  speaker text,
  start_time time without time zone,
  end_time time without time zone,
  meeting_provider text,
  registration_required boolean DEFAULT false NOT NULL,
  max_participants integer,
  status text DEFAULT 'draft'::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.halaqa_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  halaqa_id uuid NOT NULL,
  scheduled_at timestamp with time zone,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  started_by uuid,
  meeting_url_override text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.halaqas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  gender gender_type NOT NULL,
  level quran_level NOT NULL,
  teacher_id uuid,
  supervisor_id uuid,
  schedule text,
  meeting_link text,
  description text,
  status halaqa_status DEFAULT 'active'::halaqa_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  max_students integer,
  meeting_provider text,
  schedule_days text[],
  meeting_id text,
  meeting_passcode text,
  live_session_active boolean DEFAULT false NOT NULL,
  live_session_started_at timestamp with time zone,
  live_session_started_by uuid,
  halaqa_date date,
  halaqa_day smallint
);
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text,
  attachment_url text,
  attachment_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  is_read boolean DEFAULT false NOT NULL,
  link text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.parent_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  parent_user_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  subscription_name_ar text DEFAULT 'اشتراك رواء'::text NOT NULL,
  subscription_name_fr text DEFAULT 'Abonnement Rawa'::text NOT NULL,
  subscription_name_en text DEFAULT 'Rawa Subscription'::text NOT NULL,
  description_ar text DEFAULT 'اشتراك كامل في منصة رواء لتعليم القرآن الكريم وعلومه.'::text NOT NULL,
  description_fr text DEFAULT 'Abonnement complet à la plateforme Rawa.'::text NOT NULL,
  description_en text DEFAULT 'Full access to the Rawa Quran Academy.'::text NOT NULL,
  price_dzd numeric(10,2) DEFAULT 3000 NOT NULL,
  currency text DEFAULT 'DZD'::text NOT NULL,
  ccp_number text DEFAULT ''::text NOT NULL,
  ccp_key text,
  account_holder text DEFAULT ''::text NOT NULL,
  rip_number text,
  qr_code_url text,
  subscription_duration_days integer DEFAULT 30 NOT NULL,
  benefits_ar jsonb DEFAULT '["حضور الحلقات المباشرة", "تصحيح التلاوة", "متابعة الحفظ", "تقييمات دورية", "تقارير للطالب وولي الأمر", "المشاركة في الدورات والفعاليات", "الوصول الكامل للمنصة"]'::jsonb NOT NULL,
  benefits_fr jsonb DEFAULT '[]'::jsonb NOT NULL,
  benefits_en jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  amount numeric(10,2) NOT NULL,
  transaction_number text NOT NULL,
  payment_date date NOT NULL,
  receipt_file_url text NOT NULL,
  status payment_status DEFAULT 'pending'::payment_status NOT NULL,
  admin_notes text,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  payment_method payment_method DEFAULT 'edahabia'::payment_method NOT NULL,
  payment_ref text,
  qr_token text,
  qr_payload jsonb,
  qr_expires_at timestamp with time zone,
  receipt_sha256 text,
  client_ip text
);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text DEFAULT ''::text NOT NULL,
  parent_name text,
  email text,
  phone text,
  gender gender_type,
  age integer,
  country text,
  city text,
  quran_level quran_level,
  preferred_schedule text,
  status student_status DEFAULT 'pending_review'::student_status NOT NULL,
  language app_language DEFAULT 'ar'::app_language NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  date_of_birth date,
  state text,
  phone_country text,
  phone_code text,
  phone_number text
);
CREATE TABLE IF NOT EXISTS public.session_recordings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id uuid,
  halaqa_id uuid NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid NOT NULL,
  duration_seconds integer,
  size_bytes bigint,
  title text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.student_halaqas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_id uuid NOT NULL,
  halaqa_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.students (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  profile_id uuid NOT NULL,
  student_code text,
  enrollment_date date DEFAULT CURRENT_DATE NOT NULL,
  guardian_name text,
  guardian_phone text,
  emergency_contact text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_id uuid NOT NULL,
  payment_id uuid,
  status subscription_status DEFAULT 'pending'::subscription_status NOT NULL,
  start_date timestamp with time zone DEFAULT now() NOT NULL,
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  reminders_sent jsonb DEFAULT '[]'::jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.supervisor_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  halaqa_id uuid NOT NULL,
  student_id uuid NOT NULL,
  author_id uuid NOT NULL,
  category supervisor_note_category DEFAULT 'follow_up'::supervisor_note_category NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------- CONSTRAINTS (PK / UNIQUE / CHECK / FK) ----------
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);
ALTER TABLE assignments ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);
ALTER TABLE attendance ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);
ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_pkey PRIMARY KEY (id);
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE conversation_members ADD CONSTRAINT conversation_members_pkey PRIMARY KEY (id);
ALTER TABLE conversations ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);
ALTER TABLE events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE halaqa_sessions ADD CONSTRAINT halaqa_sessions_pkey PRIMARY KEY (id);
ALTER TABLE halaqas ADD CONSTRAINT halaqas_pkey PRIMARY KEY (id);
ALTER TABLE messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE parent_links ADD CONSTRAINT parent_links_pkey PRIMARY KEY (id);
ALTER TABLE payment_settings ADD CONSTRAINT payment_settings_pkey PRIMARY KEY (id);
ALTER TABLE payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE session_recordings ADD CONSTRAINT session_recordings_pkey PRIMARY KEY (id);
ALTER TABLE student_halaqas ADD CONSTRAINT student_halaqas_pkey PRIMARY KEY (id);
ALTER TABLE students ADD CONSTRAINT students_pkey PRIMARY KEY (id);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE supervisor_notes ADD CONSTRAINT supervisor_notes_pkey PRIMARY KEY (id);
ALTER TABLE user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);
ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_token_key UNIQUE (token);
ALTER TABLE attendance ADD CONSTRAINT attendance_student_id_halaqa_id_date_key UNIQUE (student_id, halaqa_id, date);
ALTER TABLE conversation_members ADD CONSTRAINT conversation_members_conversation_id_user_id_key UNIQUE (conversation_id, user_id);
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_event_id_user_id_key UNIQUE (event_id, user_id);
ALTER TABLE parent_links ADD CONSTRAINT parent_links_parent_user_id_student_user_id_key UNIQUE (parent_user_id, student_user_id);
ALTER TABLE student_halaqas ADD CONSTRAINT student_halaqas_student_id_halaqa_id_key UNIQUE (student_id, halaqa_id);
ALTER TABLE students ADD CONSTRAINT students_profile_id_key UNIQUE (profile_id);
ALTER TABLE students ADD CONSTRAINT students_student_code_key UNIQUE (student_code);
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_behavior_score_check CHECK (((behavior_score IS NULL) OR ((behavior_score >= 0) AND (behavior_score <= 100))));
ALTER TABLE evaluations ADD CONSTRAINT evaluations_fluency_score_check CHECK (((fluency_score >= 0) AND (fluency_score <= 100)));
ALTER TABLE evaluations ADD CONSTRAINT evaluations_memorization_score_check CHECK (((memorization_score >= 0) AND (memorization_score <= 100)));
ALTER TABLE evaluations ADD CONSTRAINT evaluations_participation_score_check CHECK (((participation_score >= 0) AND (participation_score <= 100)));
ALTER TABLE evaluations ADD CONSTRAINT evaluations_tajweed_score_check CHECK (((tajweed_score >= 0) AND (tajweed_score <= 100)));
ALTER TABLE halaqas ADD CONSTRAINT halaqas_halaqa_day_check CHECK (((halaqa_day IS NULL) OR ((halaqa_day >= 0) AND (halaqa_day <= 6))));
ALTER TABLE halaqas ADD CONSTRAINT halaqas_meeting_provider_check CHECK (((meeting_provider IS NULL) OR (meeting_provider = ANY (ARRAY['google_meet'::text, 'zoom'::text, 'jitsi'::text, 'other'::text]))));
ALTER TABLE messages ADD CONSTRAINT messages_check CHECK (((body IS NOT NULL) OR (attachment_url IS NOT NULL)));
ALTER TABLE profiles ADD CONSTRAINT profiles_age_check CHECK (((age IS NULL) OR ((age > 2) AND (age < 120))));
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT assignments_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD CONSTRAINT attendance_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE attendance ADD CONSTRAINT attendance_session_id_fkey FOREIGN KEY (session_id) REFERENCES halaqa_sessions(id) ON DELETE SET NULL;
ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE conversation_members ADD CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE conversation_members ADD CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD CONSTRAINT conversations_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE SET NULL;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_session_id_fkey FOREIGN KEY (session_id) REFERENCES halaqa_sessions(id) ON DELETE SET NULL;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE halaqa_sessions ADD CONSTRAINT halaqa_sessions_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE halaqa_sessions ADD CONSTRAINT halaqa_sessions_started_by_fkey FOREIGN KEY (started_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE halaqas ADD CONSTRAINT halaqas_live_session_started_by_fkey FOREIGN KEY (live_session_started_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE halaqas ADD CONSTRAINT halaqas_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE halaqas ADD CONSTRAINT halaqas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE parent_links ADD CONSTRAINT parent_links_parent_user_id_fkey FOREIGN KEY (parent_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE parent_links ADD CONSTRAINT parent_links_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE payments ADD CONSTRAINT payments_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE payments ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE session_recordings ADD CONSTRAINT session_recordings_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE session_recordings ADD CONSTRAINT session_recordings_session_id_fkey FOREIGN KEY (session_id) REFERENCES halaqa_sessions(id) ON DELETE CASCADE;
ALTER TABLE session_recordings ADD CONSTRAINT session_recordings_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE student_halaqas ADD CONSTRAINT student_halaqas_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE student_halaqas ADD CONSTRAINT student_halaqas_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE students ADD CONSTRAINT students_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE supervisor_notes ADD CONSTRAINT supervisor_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE supervisor_notes ADD CONSTRAINT supervisor_notes_halaqa_id_fkey FOREIGN KEY (halaqa_id) REFERENCES halaqas(id) ON DELETE CASCADE;
ALTER TABLE supervisor_notes ADD CONSTRAINT supervisor_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------- INDEXES (non-constraint) ----------
CREATE INDEX attendance_date_idx ON public.attendance USING btree (date DESC);
CREATE INDEX attendance_halaqa_date_idx ON public.attendance USING btree (halaqa_id, date DESC);
CREATE INDEX attendance_session_idx ON public.attendance USING btree (session_id);
CREATE INDEX attendance_sessions_halaqa_idx ON public.attendance_sessions USING btree (halaqa_id);
CREATE INDEX attendance_sessions_token_idx ON public.attendance_sessions USING btree (token);
CREATE INDEX attendance_student_idx ON public.attendance USING btree (student_id, date DESC);
CREATE UNIQUE INDEX attendance_unique_student_halaqa_date ON public.attendance USING btree (student_id, halaqa_id, date);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs USING btree (actor_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity_type, entity_id);
CREATE INDEX evaluations_session_idx ON public.evaluations USING btree (session_id);
CREATE INDEX evaluations_student_idx ON public.evaluations USING btree (student_id, created_at DESC);
CREATE INDEX halaqa_sessions_halaqa_idx ON public.halaqa_sessions USING btree (halaqa_id, started_at DESC);
CREATE INDEX idx_conv_members_conv ON public.conversation_members USING btree (conversation_id);
CREATE INDEX idx_conv_members_user ON public.conversation_members USING btree (user_id);
CREATE INDEX idx_messages_conv_created ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX payments_created_at_idx ON public.payments USING btree (created_at DESC);
CREATE UNIQUE INDEX payments_payment_ref_unique ON public.payments USING btree (payment_ref) WHERE (payment_ref IS NOT NULL);
CREATE UNIQUE INDEX payments_receipt_sha_unique ON public.payments USING btree (receipt_sha256) WHERE (receipt_sha256 IS NOT NULL);
CREATE INDEX payments_status_idx ON public.payments USING btree (status);
CREATE INDEX payments_student_idx ON public.payments USING btree (student_id);
CREATE INDEX students_profile_id_idx ON public.students USING btree (profile_id);
CREATE UNIQUE INDEX subscriptions_one_active ON public.subscriptions USING btree (student_id) WHERE (status = 'active'::subscription_status);
CREATE INDEX subscriptions_student_idx ON public.subscriptions USING btree (student_id);

-- ---------- FUNCTIONS (incl. SECURITY DEFINER) ----------
CREATE OR REPLACE FUNCTION private.can_submit_payment(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = _user_id
      AND created_at > now() - interval '60 seconds'
  );
$function$
;

CREATE OR REPLACE FUNCTION private.has_active_subscription(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE student_id = _user_id
      AND status = 'active'
      AND end_date >= now()
  );
$function$
;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$function$
;

CREATE OR REPLACE FUNCTION private.in_halaqa(_user_id uuid, _halaqa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas WHERE id = _halaqa_id AND (teacher_id = _user_id OR supervisor_id = _user_id)
  ) OR EXISTS (
    SELECT 1 FROM public.student_halaqas WHERE halaqa_id = _halaqa_id AND student_id = _user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION private.is_conversation_member(_user_id uuid, _conversation_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION private.is_parent_child_in_halaqa(_parent_id uuid, _halaqa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.student_halaqas sh
    JOIN public.parent_links pl ON pl.student_user_id = sh.student_id
    WHERE sh.halaqa_id = _halaqa_id AND pl.parent_user_id = _parent_id
  );
$function$
;

CREATE OR REPLACE FUNCTION private.is_parent_of(_parent_id uuid, _student_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.parent_links
    WHERE parent_user_id = _parent_id AND student_user_id = _student_id);
$function$
;

CREATE OR REPLACE FUNCTION private.is_staff_for_halaqa(_user_id uuid, _halaqa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas WHERE id = _halaqa_id AND (teacher_id = _user_id OR supervisor_id = _user_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION private.is_student_in_halaqa(_user_id uuid, _halaqa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.student_halaqas WHERE halaqa_id = _halaqa_id AND student_id = _user_id);
$function$
;

CREATE OR REPLACE FUNCTION private.primary_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'director' THEN 1
    WHEN 'general_supervisor' THEN 2
    WHEN 'halaqa_supervisor' THEN 3
    WHEN 'teacher' THEN 4
    WHEN 'student' THEN 5
  END
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION private.teacher_owns_halaqa(halaqa_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas h
    WHERE h.id = halaqa_uuid
      AND h.teacher_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION private.teaches_halaqa(_user_id uuid, _halaqa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.halaqas
    WHERE id = _halaqa_id
      AND (teacher_id = _user_id OR supervisor_id = _user_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.audit_payment_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$
;

CREATE OR REPLACE FUNCTION public.bump_conversation_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.enforce_halaqa_gender()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END; $function$
;

CREATE OR REPLACE FUNCTION public.enforce_student_halaqa_gender()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE sg public.gender_type; hg public.gender_type;
BEGIN
  SELECT gender INTO sg FROM public.profiles WHERE id = NEW.student_id;
  SELECT gender INTO hg FROM public.halaqas WHERE id = NEW.halaqa_id;
  IF sg IS NOT NULL AND hg IS NOT NULL AND sg <> hg THEN
    RAISE EXCEPTION 'Student gender must match halaqa gender';
  END IF;
  RETURN NEW;
END; $function$
;

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
END; $function$
;

CREATE OR REPLACE FUNCTION public.handle_payment_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duration int;
  v_existing public.subscriptions%ROWTYPE;
  v_start timestamptz;
  v_end timestamptz;
  r record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR r IN SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'director' LOOP
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (r.user_id, 'طلب دفع جديد', 'تم استلام طلب اشتراك جديد من ' || NEW.full_name, '/admin');
    END LOOP;
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (NEW.student_id, 'تم إرسال طلب الدفع', 'سيتم مراجعة العملية من طرف الإدارة.', '/subscribe');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      SELECT subscription_duration_days INTO v_duration FROM public.payment_settings LIMIT 1;
      v_duration := COALESCE(v_duration, 30);
      SELECT * INTO v_existing FROM public.subscriptions WHERE student_id = NEW.student_id AND status = 'active' LIMIT 1;
      v_start := now();
      IF v_existing.id IS NOT NULL AND v_existing.end_date > now() THEN
        v_start := v_existing.end_date;
        v_end := v_start + (v_duration || ' days')::interval;
        UPDATE public.subscriptions SET end_date = v_end, payment_id = NEW.id, updated_at = now() WHERE id = v_existing.id;
      ELSE
        v_end := v_start + (v_duration || ' days')::interval;
        IF v_existing.id IS NOT NULL THEN
          UPDATE public.subscriptions SET status = 'expired' WHERE id = v_existing.id;
        END IF;
        INSERT INTO public.subscriptions (student_id, payment_id, status, start_date, end_date)
        VALUES (NEW.student_id, NEW.id, 'active', v_start, v_end);
      END IF;
      NEW.approved_at := now();
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.student_id, 'تمت الموافقة على الدفع', 'تمت الموافقة على عملية الدفع وتفعيل اشتراكك بنجاح.', '/dashboard');
    ELSIF NEW.status = 'rejected' THEN
      NEW.rejected_at := now();
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (NEW.student_id, 'تم رفض الدفع', COALESCE('تم رفض عملية الدفع. ' || NEW.admin_notes, 'تم رفض عملية الدفع. يرجى مراجعة الإدارة.'), '/subscribe');
    END IF;
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.notify_attendance_marked()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record; label text;
BEGIN
  label := CASE NEW.status
    WHEN 'present' THEN '✅ حاضر'
    WHEN 'late' THEN '⏰ متأخر'
    WHEN 'absent' THEN '❌ غائب'
    ELSE NEW.status::text
  END;
  INSERT INTO public.notifications (user_id, title, content, link)
  VALUES (NEW.student_id, 'تم تسجيل الحضور', label || ' بتاريخ ' || NEW.date::text, '/dashboard');
  FOR r IN SELECT parent_user_id AS uid FROM public.parent_links WHERE student_user_id = NEW.student_id LOOP
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (r.uid, 'حضور ابنك/ابنتك', label || ' بتاريخ ' || NEW.date::text, '/dashboard');
  END LOOP;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.notify_evaluation_submitted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record;
BEGIN
  INSERT INTO public.notifications (user_id, title, content, link)
  VALUES (NEW.student_id, '⭐ تقييم جديد', 'تم تسجيل تقييم جديد لك.', '/dashboard');
  FOR r IN SELECT parent_user_id AS uid FROM public.parent_links WHERE student_user_id = NEW.student_id LOOP
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (r.uid, '⭐ تقييم جديد لابنك/ابنتك', 'تم تسجيل تقييم جديد.', '/dashboard');
  END LOOP;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.notify_event_published()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    FOR r IN SELECT id FROM public.profiles WHERE status = 'approved' LOOP
      INSERT INTO public.notifications (user_id, title, content, link)
      VALUES (r.id, 'فعالية جديدة: ' || NEW.title, COALESCE(NEW.description, ''), '/events');
    END LOOP;
  END IF;
  RETURN NEW;
END $function$
;

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
END $function$
;

CREATE OR REPLACE FUNCTION public.notify_live_session_started()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record;
BEGIN
  IF NEW.live_session_active = true AND (TG_OP = 'INSERT' OR OLD.live_session_active IS DISTINCT FROM true) THEN
    FOR r IN
      SELECT sh.student_id AS uid FROM public.student_halaqas sh WHERE sh.halaqa_id = NEW.id
      UNION
      SELECT NEW.supervisor_id WHERE NEW.supervisor_id IS NOT NULL
    LOOP
      IF r.uid IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, content, link)
        VALUES (r.uid, '🟢 الحلقة بدأت الآن', 'انضم إلى حلقة ' || NEW.name, '/dashboard');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END $function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.process_subscription_reminders()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;


-- ---------- VIEWS ----------

-- ---------- TRIGGERS ----------
CREATE TRIGGER trg_notify_attendance_marked AFTER INSERT OR UPDATE OF status ON public.attendance FOR EACH ROW EXECUTE FUNCTION notify_attendance_marked();
CREATE TRIGGER trg_conv_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notify_evaluation_submitted AFTER INSERT ON public.evaluations FOR EACH ROW EXECUTE FUNCTION notify_evaluation_submitted();
CREATE TRIGGER events_notify AFTER INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION notify_event_published();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER halaqa_sessions_updated_at BEFORE UPDATE ON public.halaqa_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER halaqas_gender_check BEFORE INSERT OR UPDATE ON public.halaqas FOR EACH ROW EXECUTE FUNCTION enforce_halaqa_gender();
CREATE TRIGGER halaqas_notify AFTER INSERT OR UPDATE ON public.halaqas FOR EACH ROW EXECUTE FUNCTION notify_halaqa_activated();
CREATE TRIGGER halaqas_restrict_field_changes BEFORE UPDATE ON public.halaqas FOR EACH ROW EXECUTE FUNCTION prevent_non_director_halaqa_field_changes();
CREATE TRIGGER halaqas_updated_at BEFORE UPDATE ON public.halaqas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notify_live_session_started AFTER INSERT OR UPDATE OF live_session_active ON public.halaqas FOR EACH ROW EXECUTE FUNCTION notify_live_session_started();
CREATE TRIGGER trg_bump_conv_msg AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION bump_conversation_on_message();
CREATE TRIGGER payment_settings_updated BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payments_after_insert AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION handle_payment_status_change();
CREATE TRIGGER payments_audit_trg AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION audit_payment_changes();
CREATE TRIGGER payments_before_status_update BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION handle_payment_status_change();
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER student_halaqas_gender_check BEFORE INSERT OR UPDATE ON public.student_halaqas FOR EACH ROW EXECUTE FUNCTION enforce_student_halaqa_gender();
CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- AUTH TRIGGERS ON auth.users (recreate manually if needed) ----------
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------- GRANTS ----------
GRANT DELETE, INSERT, SELECT, UPDATE ON public.assignment_submissions TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.assignment_submissions TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.assignment_submissions TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.assignments TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.assignments TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.assignments TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.attendance TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.attendance TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.attendance TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.attendance_sessions TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.attendance_sessions TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.attendance_sessions TO service_role;
GRANT DELETE, SELECT, UPDATE ON public.audit_logs TO anon;
GRANT DELETE, SELECT, UPDATE ON public.audit_logs TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.audit_logs TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.conversation_members TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.conversation_members TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.conversation_members TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.conversations TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.conversations TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.conversations TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.evaluations TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.evaluations TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.evaluations TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.event_registrations TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.event_registrations TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.event_registrations TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.events TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.events TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.events TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.halaqa_sessions TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.halaqa_sessions TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.halaqa_sessions TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.halaqas TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.halaqas TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.messages TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.messages TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.messages TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.notifications TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.notifications TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.notifications TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.parent_links TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.parent_links TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.parent_links TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.payment_settings TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.payment_settings TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.payment_settings TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.payments TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.payments TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.payments TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.profiles TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.session_recordings TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.session_recordings TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.session_recordings TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.student_halaqas TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.student_halaqas TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.student_halaqas TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.students TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.students TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.students TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.subscriptions TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.subscriptions TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.subscriptions TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.supervisor_notes TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.supervisor_notes TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.supervisor_notes TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_roles TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_roles TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.user_roles TO service_role;

-- ---------- ROW LEVEL SECURITY ----------
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_halaqas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------- RLS POLICIES ----------
CREATE POLICY "Director reads submissions" ON public.assignment_submissions AS PERMISSIVE FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Student manages own submissions" ON public.assignment_submissions AS PERMISSIVE FOR ALL TO authenticated USING ((student_id = auth.uid())) WITH CHECK ((student_id = auth.uid()));
CREATE POLICY "Teacher reads submissions for own assignments" ON public.assignment_submissions AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = assignment_submissions.assignment_id) AND (a.teacher_id = auth.uid())))));
CREATE POLICY "Director manages assignments" ON public.assignments AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Parent reads child assignments" ON public.assignments AS PERMISSIVE FOR SELECT TO authenticated USING (((student_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM parent_links p
  WHERE ((p.parent_user_id = auth.uid()) AND (p.student_user_id = assignments.student_id))))));
CREATE POLICY "Student reads own assignments" ON public.assignments AS PERMISSIVE FOR SELECT TO authenticated USING ((((student_id = auth.uid()) OR ((halaqa_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM student_halaqas sh
  WHERE ((sh.halaqa_id = assignments.halaqa_id) AND (sh.student_id = auth.uid())))))) AND private.has_active_subscription(auth.uid())));
CREATE POLICY "Supervisor reads halaqa assignments" ON public.assignments AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((halaqa_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = assignments.halaqa_id) AND (h.supervisor_id = auth.uid())))))));
CREATE POLICY "Teacher manages own assignments" ON public.assignments AS PERMISSIVE FOR ALL TO authenticated USING ((teacher_id = auth.uid())) WITH CHECK (((teacher_id = auth.uid()) AND private.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Director manages attendance" ON public.attendance AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Halaqa staff reads attendance" ON public.attendance AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = attendance.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid())))))));
CREATE POLICY "Parent reads child attendance" ON public.attendance AS PERMISSIVE FOR SELECT TO authenticated USING (private.is_parent_of(auth.uid(), student_id));
CREATE POLICY "Student reads own attendance" ON public.attendance AS PERMISSIVE FOR SELECT TO authenticated USING (((student_id = auth.uid()) AND private.has_active_subscription(auth.uid())));
CREATE POLICY "Supervisor records attendance" ON public.attendance AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = attendance.halaqa_id) AND (h.supervisor_id = auth.uid())))));
CREATE POLICY "Supervisor updates attendance" ON public.attendance AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = attendance.halaqa_id) AND (h.supervisor_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = attendance.halaqa_id) AND (h.supervisor_id = auth.uid())))));
CREATE POLICY "Teacher reads attendance" ON public.attendance AS PERMISSIVE FOR SELECT TO authenticated USING (private.teacher_owns_halaqa(halaqa_id));
CREATE POLICY "Teacher records attendance" ON public.attendance AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (private.teacher_owns_halaqa(halaqa_id));
CREATE POLICY "Teacher updates attendance" ON public.attendance AS PERMISSIVE FOR UPDATE TO authenticated USING (private.teacher_owns_halaqa(halaqa_id)) WITH CHECK (private.teacher_owns_halaqa(halaqa_id));
CREATE POLICY "Teacher and enrolled students can view sessions" ON public.attendance_sessions AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = teacher_id) OR (EXISTS ( SELECT 1
   FROM student_halaqas sh
  WHERE ((sh.halaqa_id = attendance_sessions.halaqa_id) AND (sh.student_id = auth.uid()))))));
CREATE POLICY "Teacher can create own attendance sessions" ON public.attendance_sessions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = teacher_id) AND (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = attendance_sessions.halaqa_id) AND (h.teacher_id = auth.uid()))))));
CREATE POLICY "Teacher can update own attendance sessions" ON public.attendance_sessions AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));
CREATE POLICY "audit_director_read" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "cmembers_delete_self_or_director" ON public.conversation_members AS PERMISSIVE FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "cmembers_insert_creator_or_member" ON public.conversation_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.has_role(auth.uid(), 'director'::app_role) OR (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = conversation_members.conversation_id) AND (c.created_by = auth.uid())))) OR private.is_conversation_member(auth.uid(), conversation_id)));
CREATE POLICY "cmembers_select_self_or_member" ON public.conversation_members AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR private.is_conversation_member(auth.uid(), conversation_id) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "cmembers_update_self" ON public.conversation_members AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "conv_delete_director" ON public.conversations AS PERMISSIVE FOR DELETE TO authenticated USING (((created_by = auth.uid()) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "conv_insert_auth" ON public.conversations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));
CREATE POLICY "conv_select_members" ON public.conversations AS PERMISSIVE FOR SELECT TO authenticated USING ((private.is_conversation_member(auth.uid(), id) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "conv_update_members" ON public.conversations AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.is_conversation_member(auth.uid(), id) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "Director manages evaluations" ON public.evaluations AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "General supervisor reads evaluations" ON public.evaluations AS PERMISSIVE FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'general_supervisor'::app_role));
CREATE POLICY "Parent reads child evaluations" ON public.evaluations AS PERMISSIVE FOR SELECT TO authenticated USING (private.is_parent_of(auth.uid(), student_id));
CREATE POLICY "Student reads own evaluations" ON public.evaluations AS PERMISSIVE FOR SELECT TO authenticated USING (((student_id = auth.uid()) AND private.has_active_subscription(auth.uid())));
CREATE POLICY "Teacher creates evaluations" ON public.evaluations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((teacher_id = auth.uid()) AND private.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Teacher reads own evaluations" ON public.evaluations AS PERMISSIVE FOR SELECT TO authenticated USING ((teacher_id = auth.uid()));
CREATE POLICY "Teacher updates own evaluations" ON public.evaluations AS PERMISSIVE FOR UPDATE TO authenticated USING ((teacher_id = auth.uid())) WITH CHECK ((teacher_id = auth.uid()));
CREATE POLICY "Director reads all registrations" ON public.event_registrations AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role)));
CREATE POLICY "User manages own registration" ON public.event_registrations AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = auth.uid()) OR private.has_role(auth.uid(), 'director'::app_role))) WITH CHECK (((user_id = auth.uid()) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "Director manages events" ON public.events AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Staff reads all events" ON public.events AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role)));
CREATE POLICY "Users read published events" ON public.events AS PERMISSIVE FOR SELECT TO authenticated USING (((status = ANY (ARRAY['published'::text, 'completed'::text])) AND ((NOT private.has_role(auth.uid(), 'student'::app_role)) OR private.has_active_subscription(auth.uid()))));
CREATE POLICY "Members read sessions" ON public.halaqa_sessions AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = halaqa_sessions.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid()))))) OR ((EXISTS ( SELECT 1
   FROM student_halaqas sh
  WHERE ((sh.halaqa_id = halaqa_sessions.halaqa_id) AND (sh.student_id = auth.uid())))) AND private.has_active_subscription(auth.uid())) OR (EXISTS ( SELECT 1
   FROM (student_halaqas sh
     JOIN parent_links pl ON ((pl.student_user_id = sh.student_id)))
  WHERE ((sh.halaqa_id = halaqa_sessions.halaqa_id) AND (pl.parent_user_id = auth.uid()))))));
CREATE POLICY "Teacher/supervisor manage sessions" ON public.halaqa_sessions AS PERMISSIVE FOR ALL TO authenticated USING (((EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = halaqa_sessions.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid()))))) OR private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = halaqa_sessions.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid()))))) OR private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role)));
CREATE POLICY "Director manages halaqas" ON public.halaqas AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "General supervisor reads all halaqas" ON public.halaqas AS PERMISSIVE FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'general_supervisor'::app_role));
CREATE POLICY "Parent reads child published halaqas" ON public.halaqas AS PERMISSIVE FOR SELECT TO authenticated USING (((status = 'published'::halaqa_status) AND private.is_parent_child_in_halaqa(auth.uid(), id)));
CREATE POLICY "Student reads assigned published halaqas" ON public.halaqas AS PERMISSIVE FOR SELECT TO authenticated USING (((status = 'published'::halaqa_status) AND private.is_student_in_halaqa(auth.uid(), id) AND private.has_active_subscription(auth.uid())));
CREATE POLICY "Supervisor reads assigned halaqas" ON public.halaqas AS PERMISSIVE FOR SELECT TO authenticated USING (((supervisor_id = auth.uid()) AND (status <> 'draft'::halaqa_status)));
CREATE POLICY "Supervisor updates assigned halaqas" ON public.halaqas AS PERMISSIVE FOR UPDATE TO authenticated USING ((supervisor_id = auth.uid())) WITH CHECK ((supervisor_id = auth.uid()));
CREATE POLICY "Teacher reads assigned halaqas" ON public.halaqas AS PERMISSIVE FOR SELECT TO authenticated USING (((teacher_id = auth.uid()) AND (status <> 'draft'::halaqa_status)));
CREATE POLICY "Teacher updates assigned halaqas" ON public.halaqas AS PERMISSIVE FOR UPDATE TO authenticated USING ((teacher_id = auth.uid())) WITH CHECK ((teacher_id = auth.uid()));
CREATE POLICY "msg_delete_own_or_director" ON public.messages AS PERMISSIVE FOR DELETE TO authenticated USING (((sender_id = auth.uid()) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "msg_insert_member_self" ON public.messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((sender_id = auth.uid()) AND private.is_conversation_member(auth.uid(), conversation_id)));
CREATE POLICY "msg_select_members" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING ((private.is_conversation_member(auth.uid(), conversation_id) OR private.has_role(auth.uid(), 'director'::app_role)));
CREATE POLICY "msg_update_own" ON public.messages AS PERMISSIVE FOR UPDATE TO authenticated USING ((sender_id = auth.uid()));
CREATE POLICY "Director manages notifications" ON public.notifications AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "User reads own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "User updates own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Director manages parent links" ON public.parent_links AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Parent and student read link" ON public.parent_links AS PERMISSIVE FOR SELECT TO authenticated USING (((parent_user_id = auth.uid()) OR (student_user_id = auth.uid())));
CREATE POLICY "settings_director_write" ON public.payment_settings AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "settings_read_students_directors" ON public.payment_settings AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'student'::app_role)));
CREATE POLICY "payments_director_update" ON public.payments AS PERMISSIVE FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "payments_student_insert_own" ON public.payments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((student_id = auth.uid()));
CREATE POLICY "payments_student_select_own" ON public.payments AS PERMISSIVE FOR SELECT TO authenticated USING (((student_id = auth.uid()) OR private.has_role(auth.uid(), 'director'::app_role) OR private.is_parent_of(auth.uid(), student_id)));
CREATE POLICY "Director deletes profiles" ON public.profiles AS PERMISSIVE FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Director inserts profiles" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Director updates any profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Parent reads child profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (private.is_parent_of(auth.uid(), id));
CREATE POLICY "Staff read profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)));
CREATE POLICY "Users read their own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Users update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "edit recordings" ON public.session_recordings AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = session_recordings.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid())))))));
CREATE POLICY "moderate recordings" ON public.session_recordings AS PERMISSIVE FOR DELETE TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)));
CREATE POLICY "upload recordings" ON public.session_recordings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((uploaded_by = auth.uid()) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = session_recordings.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid()))))))));
CREATE POLICY "watch recordings" ON public.session_recordings AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = session_recordings.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid()))))) OR ((EXISTS ( SELECT 1
   FROM student_halaqas sh
  WHERE ((sh.halaqa_id = session_recordings.halaqa_id) AND (sh.student_id = auth.uid())))) AND private.has_active_subscription(auth.uid())) OR (EXISTS ( SELECT 1
   FROM (parent_links pl
     JOIN student_halaqas sh ON ((sh.student_id = pl.student_user_id)))
  WHERE ((pl.parent_user_id = auth.uid()) AND (sh.halaqa_id = session_recordings.halaqa_id))))));
CREATE POLICY "Director manages student_halaqas" ON public.student_halaqas AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Parent reads child halaqa memberships" ON public.student_halaqas AS PERMISSIVE FOR SELECT TO authenticated USING (private.is_parent_of(auth.uid(), student_id));
CREATE POLICY "Staff reads assignments" ON public.student_halaqas AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.is_staff_for_halaqa(auth.uid(), halaqa_id)));
CREATE POLICY "Student reads own halaqa memberships" ON public.student_halaqas AS PERMISSIVE FOR SELECT TO authenticated USING (((student_id = auth.uid()) AND private.has_active_subscription(auth.uid())));
CREATE POLICY "Directors manage students" ON public.students AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Staff view all students" ON public.students AS PERMISSIVE FOR SELECT TO authenticated USING ((private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role) OR private.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Students view own record" ON public.students AS PERMISSIVE FOR SELECT TO authenticated USING ((profile_id = auth.uid()));
CREATE POLICY "subs_director_all" ON public.subscriptions AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "subs_select_own_or_director_or_parent" ON public.subscriptions AS PERMISSIVE FOR SELECT TO authenticated USING (((student_id = auth.uid()) OR private.has_role(auth.uid(), 'director'::app_role) OR private.is_parent_of(auth.uid(), student_id)));
CREATE POLICY "Author deletes own notes" ON public.supervisor_notes AS PERMISSIVE FOR DELETE TO authenticated USING ((author_id = auth.uid()));
CREATE POLICY "Author updates own notes" ON public.supervisor_notes AS PERMISSIVE FOR UPDATE TO authenticated USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));
CREATE POLICY "Director manages supervisor notes" ON public.supervisor_notes AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "General supervisor reads notes" ON public.supervisor_notes AS PERMISSIVE FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'general_supervisor'::app_role));
CREATE POLICY "Halaqa staff reads notes" ON public.supervisor_notes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = supervisor_notes.halaqa_id) AND ((h.teacher_id = auth.uid()) OR (h.supervisor_id = auth.uid()))))));
CREATE POLICY "Parent reads child supervisor notes" ON public.supervisor_notes AS PERMISSIVE FOR SELECT TO authenticated USING (private.is_parent_of(auth.uid(), student_id));
CREATE POLICY "Student reads own notes" ON public.supervisor_notes AS PERMISSIVE FOR SELECT TO authenticated USING ((student_id = auth.uid()));
CREATE POLICY "Supervisor creates notes" ON public.supervisor_notes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((author_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM halaqas h
  WHERE ((h.id = supervisor_notes.halaqa_id) AND (h.supervisor_id = auth.uid()))))));
CREATE POLICY "Director manages roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Director reads all roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'director'::app_role));
CREATE POLICY "Users read own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));

-- ---------- STORAGE BUCKETS ----------
INSERT INTO storage.buckets (id,name,public) VALUES ('assignments','assignments',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('documents','documents',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('halaqa-files','halaqa-files',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('payment-receipts','payment-receipts',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('quran-audio','quran-audio',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('recordings','recordings',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('student-submissions','student-submissions',false) ON CONFLICT (id) DO NOTHING;

-- ---------- STORAGE POLICIES (storage.objects) ----------
CREATE POLICY "assignments_bucket_delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'assignments'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (owner = auth.uid()))));
CREATE POLICY "assignments_bucket_delete_scoped" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'assignments'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "assignments_bucket_read" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'assignments'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))));
CREATE POLICY "assignments_bucket_update" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'assignments'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))))) WITH CHECK (((bucket_id = 'assignments'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "assignments_bucket_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'assignments'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "documents_delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'documents'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (owner = auth.uid()))));
CREATE POLICY "documents_delete_scoped" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'documents'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "documents_read" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'documents'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))));
CREATE POLICY "documents_update" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'documents'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))))) WITH CHECK (((bucket_id = 'documents'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "documents_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'documents'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "halaqa_files_delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'halaqa-files'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (owner = auth.uid()))));
CREATE POLICY "halaqa_files_delete_scoped" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'halaqa-files'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "halaqa_files_read" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'halaqa-files'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))));
CREATE POLICY "halaqa_files_update" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'halaqa-files'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))))) WITH CHECK (((bucket_id = 'halaqa-files'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "halaqa_files_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'halaqa-files'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "quran_audio_delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'quran-audio'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (owner = auth.uid()))));
CREATE POLICY "quran_audio_delete_scoped" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'quran-audio'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "quran_audio_read" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'quran-audio'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.in_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))));
CREATE POLICY "quran_audio_update" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'quran-audio'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))))) WITH CHECK (((bucket_id = 'quran-audio'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "quran_audio_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'quran-audio'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR (private.has_role(auth.uid(), 'teacher'::app_role) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "receipts_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'payment-receipts'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR private.has_role(auth.uid(), 'director'::app_role))));
CREATE POLICY "receipts_owner_select" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'payment-receipts'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR private.has_role(auth.uid(), 'director'::app_role))));
CREATE POLICY "receipts_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'payment-receipts'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR private.has_role(auth.uid(), 'director'::app_role))));
CREATE POLICY "receipts_student_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'payment-receipts'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "recordings delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'recordings'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role) OR (owner = auth.uid()))));
CREATE POLICY "recordings delete scoped" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'recordings'::text) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((owner = auth.uid()) AND (private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "recordings read" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'recordings'::text) AND (EXISTS ( SELECT 1
   FROM session_recordings sr
  WHERE ((sr.file_path = objects.name) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.in_halaqa(auth.uid(), sr.halaqa_id) OR (EXISTS ( SELECT 1
           FROM (parent_links pl
             JOIN student_halaqas sh ON ((sh.student_id = pl.student_user_id)))
          WHERE ((pl.parent_user_id = auth.uid()) AND (sh.halaqa_id = sr.halaqa_id))))))))));
CREATE POLICY "recordings update" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'recordings'::text) AND (owner = auth.uid()) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid))))) WITH CHECK (((bucket_id = 'recordings'::text) AND (owner = auth.uid()) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "recordings write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'recordings'::text) AND (owner = auth.uid()) AND (private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR ((private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role)) AND private.teaches_halaqa(auth.uid(), ((storage.foldername(name))[1])::uuid)))));
CREATE POLICY "submissions_delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'student-submissions'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR private.has_role(auth.uid(), 'director'::app_role))));
CREATE POLICY "submissions_read" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'student-submissions'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR private.has_role(auth.uid(), 'director'::app_role) OR private.has_role(auth.uid(), 'general_supervisor'::app_role) OR private.has_role(auth.uid(), 'teacher'::app_role) OR private.has_role(auth.uid(), 'halaqa_supervisor'::app_role) OR private.is_parent_of(auth.uid(), ((storage.foldername(name))[1])::uuid))));
CREATE POLICY "submissions_update" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'student-submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "submissions_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'student-submissions'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

-- ---------- REALTIME PUBLICATION ----------
-- publication supabase_realtime includes: public.attendance
-- publication supabase_realtime includes: public.evaluations
-- publication supabase_realtime includes: public.halaqa_sessions
-- publication supabase_realtime includes: public.subscriptions
-- publication supabase_realtime includes: public.conversations
-- publication supabase_realtime includes: public.conversation_members
-- publication supabase_realtime includes: public.messages
-- publication supabase_realtime includes: public.session_recordings
-- publication supabase_realtime includes: public.attendance_sessions

-- ---------- ROW COUNTS AT BACKUP TIME (reference only) ----------
-- assignment_submissions: 0
-- assignments: 0
-- attendance: 0
-- attendance_sessions: 0
-- audit_logs: 6
-- conversation_members: 0
-- conversations: 0
-- evaluations: 0
-- event_registrations: 0
-- events: 0
-- halaqa_sessions: 0
-- halaqas: 1
-- messages: 0
-- notifications: 8
-- parent_links: 0
-- payment_settings: 1
-- payments: 0
-- profiles: 7
-- session_recordings: 0
-- student_halaqas: 2
-- students: 0
-- subscriptions: 0
-- supervisor_notes: 0
-- user_roles: 7
