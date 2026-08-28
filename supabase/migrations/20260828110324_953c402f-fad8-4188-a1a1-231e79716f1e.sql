CREATE TABLE public.game_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id text NOT NULL,
  room_code text NOT NULL,
  player_id text NOT NULL,
  phase text,
  route text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, case_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_progress TO authenticated;
GRANT ALL ON public.game_progress TO service_role;

ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_select_own" ON public.game_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "progress_insert_own" ON public.game_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update_own" ON public.game_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_delete_own" ON public.game_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER game_progress_touch_updated_at
BEFORE UPDATE ON public.game_progress
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();