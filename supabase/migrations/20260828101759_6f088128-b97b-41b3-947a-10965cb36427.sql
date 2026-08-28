CREATE TABLE public.case_trials (
  user_id UUID NOT NULL,
  case_id TEXT NOT NULL,
  consumed_seconds INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, case_id)
);

GRANT SELECT ON public.case_trials TO authenticated;
GRANT ALL ON public.case_trials TO service_role;

ALTER TABLE public.case_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trial usage"
  ON public.case_trials FOR SELECT TO authenticated
  USING (auth.uid() = user_id);