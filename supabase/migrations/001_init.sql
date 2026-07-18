-- SafetyPulse AI — initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users (synced from auth.users via trigger)
CREATE TABLE IF NOT EXISTS public.users (
    id   UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name  TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- violations detected by the safety agent
CREATE TABLE IF NOT EXISTS public.violations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.users(id),
    violation_type   TEXT NOT NULL,   -- no_hardhat | no_vest | no_mask
    label            TEXT NOT NULL,
    confidence       FLOAT NOT NULL,
    bbox             JSONB,
    camera_zone      TEXT NOT NULL DEFAULT 'Zona principal',
    detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    annotated_image  TEXT,            -- base64 data URI stored in DB for simplicity
    acknowledged     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX violations_user_id_idx ON public.violations(user_id);
CREATE INDEX violations_detected_at_idx ON public.violations(detected_at DESC);

-- trigger: sync new Supabase Auth users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
