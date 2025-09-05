-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.coaching_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  enabled_prompt_id uuid NOT NULL,
  disabled_prompt_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coaching_config_pkey PRIMARY KEY (id),
  CONSTRAINT coaching_config_disabled_prompt_id_fkey FOREIGN KEY (disabled_prompt_id) REFERENCES public.prompts(id),
  CONSTRAINT coaching_config_enabled_prompt_id_fkey FOREIGN KEY (enabled_prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.company_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE CHECK (name::text = ANY (ARRAY['google'::text, 'amazon'::text, 'microsoft'::text, 'apple'::text, 'meta'::text, 'netflix'::text, 'tesla'::text, 'startup'::text, 'consulting'::text, 'finance'::text, 'custom'::text, 'mckinsey'::text, 'bain'::text, 'bcg'::text])),
  display_name character varying NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prompt_id uuid,
  CONSTRAINT company_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT company_profiles_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.difficulty_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level character varying NOT NULL UNIQUE,
  display_name character varying NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prompt_id uuid,
  description text,
  CONSTRAINT difficulty_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT difficulty_profiles_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.interview_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  format character varying,
  type character varying,
  difficulty character varying,
  industry character varying,
  stretch_area character varying,
  total_time character varying,
  overview text,
  phases jsonb,
  additional_metadata jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prompt_id uuid,
  requires_documents boolean DEFAULT false,
  exhibits jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT interview_cases_pkey PRIMARY KEY (id),
  CONSTRAINT interview_cases_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.interview_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id character varying NOT NULL UNIQUE,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  duration_seconds numeric CHECK (duration_seconds IS NULL OR duration_seconds >= 0::numeric),
  status character varying DEFAULT 'in_progress'::character varying CHECK (status::text = ANY (ARRAY['in_progress'::character varying::text, 'completed'::character varying::text, 'error'::character varying::text, 'cancelled'::character varying::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  case_id uuid,
  transcript_path text,
  feedback_data jsonb,
  analysis_feedback_data jsonb,
  video_url text,
  video_duration_seconds numeric CHECK (video_duration_seconds >= 0::numeric),
  video_file_size_bytes bigint CHECK (video_file_size_bytes >= 0),
  user_id text,
  live_transcript_data jsonb,
  user_uuid uuid,
  new_interviewer_profile_id uuid,
  mbb_assessment_data jsonb,
  overall_score numeric CHECK (overall_score >= 0::numeric AND overall_score <= 5::numeric),
  mbb_report_data jsonb,
  CONSTRAINT interview_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT fk_interview_sessions_case_id FOREIGN KEY (case_id) REFERENCES public.interview_cases(id),
  CONSTRAINT interview_sessions_new_interviewer_profile_id_fkey FOREIGN KEY (new_interviewer_profile_id) REFERENCES public.interviewer_profiles_new(id),
  CONSTRAINT interview_sessions_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES public.users(id)
);
CREATE TABLE public.interviewer_profiles_new (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  alias character varying NOT NULL,
  difficulty_profile_id uuid NOT NULL,
  seniority_profile_id uuid NOT NULL,
  company_profile_id uuid NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  name character varying DEFAULT 'John Doe'::character varying,
  CONSTRAINT interviewer_profiles_new_pkey PRIMARY KEY (id),
  CONSTRAINT interviewer_profiles_new_user_uuid_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT interviewer_profiles_new_company_profile_id_fkey FOREIGN KEY (company_profile_id) REFERENCES public.company_profiles(id),
  CONSTRAINT interviewer_profiles_new_seniority_profile_id_fkey FOREIGN KEY (seniority_profile_id) REFERENCES public.seniority_profiles(id),
  CONSTRAINT interviewer_profiles_new_difficulty_profile_id_fkey FOREIGN KEY (difficulty_profile_id) REFERENCES public.difficulty_profiles(id)
);
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE,
  plan_name text NOT NULL,
  price_dollars integer NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  description text,
  is_popular boolean DEFAULT false,
  minutes_per_month integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  series_key text,
  version integer DEFAULT 1,
  previous_prompt_id uuid,
  is_latest boolean DEFAULT true,
  metadata jsonb,
  CONSTRAINT prompts_pkey PRIMARY KEY (id),
  CONSTRAINT prompts_previous_prompt_id_fkey FOREIGN KEY (previous_prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.seniority_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level character varying NOT NULL UNIQUE CHECK (level::text = ANY (ARRAY['intern'::character varying::text, 'entry'::character varying::text, 'mid'::character varying::text, 'senior'::character varying::text, 'staff'::character varying::text, 'principal'::character varying::text, 'director'::character varying::text, 'vp'::character varying::text, 'custom'::character varying::text])),
  display_name character varying NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prompt_id uuid,
  CONSTRAINT seniority_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT seniority_profiles_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.session_document_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  document_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_document_references_pkey PRIMARY KEY (id),
  CONSTRAINT session_document_references_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.user_documents(id)
);
CREATE TABLE public.user_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  document_type character varying NOT NULL CHECK (document_type::text = ANY (ARRAY['resume'::character varying::text, 'job_description'::character varying::text])),
  title character varying NOT NULL,
  original_filename text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  mime_type text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  session_id character varying,
  uploaded_at timestamp with time zone DEFAULT now(),
  alias text,
  last_used_at timestamp with time zone DEFAULT now(),
  extracted_text_file_path text,
  extracted_text_file_url text,
  CONSTRAINT user_documents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  usage_type text NOT NULL,
  usage_value integer NOT NULL DEFAULT 0,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_usage_pkey PRIMARY KEY (id),
  CONSTRAINT user_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_topup_minutes (
  user_id uuid NOT NULL,
  minutes_balance integer DEFAULT 0 CHECK (minutes_balance >= 0),
  total_purchased integer DEFAULT 0 CHECK (total_purchased >= 0),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_topup_minutes_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_topup_minutes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE TABLE public.coupon_codes (
  code text NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0),
  max_uses integer DEFAULT 1 CHECK (max_uses > 0),
  uses_count integer DEFAULT 0 CHECK (uses_count >= 0),
  max_uses_per_user integer DEFAULT 1 CHECK (max_uses_per_user > 0),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  active boolean DEFAULT true,
  CONSTRAINT coupon_codes_pkey PRIMARY KEY (code)
);
CREATE TABLE public.coupon_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  coupon_code text,
  minutes_added integer NOT NULL CHECK (minutes_added > 0),
  redeemed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT coupon_redemptions_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES public.coupon_codes(code)
);