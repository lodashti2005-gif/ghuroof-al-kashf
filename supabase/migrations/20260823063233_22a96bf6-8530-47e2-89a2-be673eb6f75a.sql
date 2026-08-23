INSERT INTO public.cases (id, title, code, teaser, difficulty, min_players, max_players, play_minutes, price_kwd, status, is_free, sort_order)
VALUES ('last-trip', 'آخر رحلة', 'K-0472', 'توقّف عابر في محطة طريق يتحول إلى قضية غامضة. واحد من الشباب ما رجع… وكل واحد يتذكر الليلة بطريقة مختلفة.', 'صعبة', 3, 6, 90, NULL, 'soon', false, 2)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, code = EXCLUDED.code, teaser = EXCLUDED.teaser, difficulty = EXCLUDED.difficulty, min_players = EXCLUDED.min_players, max_players = EXCLUDED.max_players, play_minutes = EXCLUDED.play_minutes, status = EXCLUDED.status, is_free = EXCLUDED.is_free, sort_order = EXCLUDED.sort_order;

DELETE FROM public.cases WHERE id = 'coming-soon-1';