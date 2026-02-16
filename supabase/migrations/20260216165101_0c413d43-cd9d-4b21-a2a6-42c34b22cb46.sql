
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  wallet_address TEXT,
  plan_tier TEXT DEFAULT 'free',
  notification_email BOOLEAN DEFAULT true,
  notification_toast BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Sentinels (configurations)
CREATE TABLE public.sentinels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Sentinel',
  contract_address TEXT NOT NULL,
  source_twitter BOOLEAN DEFAULT true,
  source_news BOOLEAN DEFAULT true,
  source_mempool BOOLEAN DEFAULT false,
  twitter_keywords TEXT,
  sensitivity INTEGER DEFAULT 1 CHECK (sensitivity >= 0 AND sensitivity <= 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sentinels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sentinels" ON public.sentinels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sentinels" ON public.sentinels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sentinels" ON public.sentinels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sentinels" ON public.sentinels FOR DELETE USING (auth.uid() = user_id);

-- Incidents
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentinel_id UUID REFERENCES public.sentinels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  block_number BIGINT,
  severity TEXT NOT NULL DEFAULT 'warning',
  status TEXT NOT NULL DEFAULT 'investigating',
  source TEXT,
  evidence TEXT,
  ai_confidence NUMERIC(3,2),
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incidents" ON public.incidents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own incidents" ON public.incidents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incidents" ON public.incidents FOR UPDATE USING (auth.uid() = user_id);

-- Intelligence logs
CREATE TABLE public.intelligence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentinel_id UUID REFERENCES public.sentinels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL,
  source_text TEXT,
  ai_analysis TEXT,
  threat_level TEXT NOT NULL DEFAULT 'safe',
  confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.intelligence_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own logs" ON public.intelligence_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sentinels_updated_at BEFORE UPDATE ON public.sentinels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for intelligence logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_logs;
