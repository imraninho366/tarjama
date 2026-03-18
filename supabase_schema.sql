-- TARJAMA — Schéma Supabase
-- Coller dans : SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  color       TEXT DEFAULT '#C9A84C',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.progress (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sourate_num  INTEGER NOT NULL,
  verse_num    INTEGER NOT NULL,
  user_trans   TEXT,
  niveau       TEXT CHECK (niveau IN ('excellent','good','partial','wrong','skipped')),
  feedback     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sourate_num, verse_num)
);

CREATE INDEX IF NOT EXISTS progress_user_idx ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS progress_sourate_idx ON public.progress(user_id, sourate_num);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "progress_select_all" ON public.progress FOR SELECT USING (true);
CREATE POLICY "progress_insert_own" ON public.progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update_own" ON public.progress FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.user_id,
  pr.username,
  pr.color,
  COUNT(*) FILTER (WHERE p.niveau IN ('excellent','good')) AS correct,
  COUNT(*) FILTER (WHERE p.niveau = 'partial')             AS partial,
  COUNT(*) FILTER (WHERE p.niveau IN ('wrong','skipped'))  AS wrong,
  COUNT(*)                                                  AS total
FROM public.progress p
JOIN public.profiles pr ON pr.id = p.user_id
GROUP BY p.user_id, pr.username, pr.color
ORDER BY correct DESC;

-- TABLE VOCABULAIRE PERSONNEL (mots rencontrés par l'utilisateur)
CREATE TABLE IF NOT EXISTS public.vocab (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ar          TEXT NOT NULL,
  translit    TEXT,
  racine      TEXT,
  sens        JSONB,
  freq        INTEGER DEFAULT 0,
  freq_label  TEXT,
  type        TEXT,
  exemple_autre TEXT,
  exemple_ref TEXT,
  sourate_num INTEGER,
  verse_num   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ar)
);

CREATE INDEX IF NOT EXISTS vocab_user_idx ON public.vocab(user_id);
CREATE INDEX IF NOT EXISTS vocab_ar_idx ON public.vocab(ar);

ALTER TABLE public.vocab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab_select_own" ON public.vocab FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vocab_insert_own" ON public.vocab FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vocab_update_own" ON public.vocab FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vocab_delete_own" ON public.vocab FOR DELETE USING (auth.uid() = user_id);
