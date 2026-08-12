CREATE TABLE public.rooms (
  code text PRIMARY KEY,
  case_id text NOT NULL,
  phase text NOT NULL DEFAULT 'lobby',
  host_player_id text NOT NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
  player_id text NOT NULL,
  name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_code, player_id)
);
CREATE INDEX room_players_room_idx ON public.room_players(room_code);

CREATE TABLE public.room_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
  player_id text NOT NULL,
  suspect_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_code, player_id)
);
CREATE INDEX room_votes_room_idx ON public.room_votes(room_code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_players TO anon, authenticated;
GRANT ALL ON public.room_players TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_votes TO anon, authenticated;
GRANT ALL ON public.room_votes TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_public_read" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "rooms_public_insert" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_public_update" ON public.rooms FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "room_players_public_read" ON public.room_players FOR SELECT USING (true);
CREATE POLICY "room_players_public_insert" ON public.room_players FOR INSERT WITH CHECK (true);
CREATE POLICY "room_players_public_update" ON public.room_players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "room_players_public_delete" ON public.room_players FOR DELETE USING (true);

CREATE POLICY "room_votes_public_read" ON public.room_votes FOR SELECT USING (true);
CREATE POLICY "room_votes_public_insert" ON public.room_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "room_votes_public_update" ON public.room_votes FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.room_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_votes;