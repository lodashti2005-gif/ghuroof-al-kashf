CREATE TABLE public.player_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  case_id text,
  room_code text,
  path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX player_events_created_at_idx ON public.player_events (created_at DESC);
CREATE INDEX player_events_type_idx ON public.player_events (event_type);
CREATE INDEX player_events_user_idx ON public.player_events (user_id);

GRANT INSERT ON public.player_events TO anon;
GRANT INSERT, SELECT ON public.player_events TO authenticated;
GRANT ALL ON public.player_events TO service_role;

ALTER TABLE public.player_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guests can log anonymous events"
  ON public.player_events FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "users can log their own events"
  ON public.player_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "admins read player events"
  ON public.player_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));