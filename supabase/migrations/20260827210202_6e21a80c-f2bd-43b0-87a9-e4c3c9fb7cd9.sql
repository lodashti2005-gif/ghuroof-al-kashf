-- منع تكرار نفس عملية Paddle (نفس provider_ref) في المشتريات
CREATE UNIQUE INDEX IF NOT EXISTS case_purchases_provider_ref_uniq
  ON public.case_purchases (provider, provider_ref)
  WHERE provider_ref IS NOT NULL;

-- منع تسجيل نفس الحدث (event_id) أكثر من مرة في السجل
CREATE UNIQUE INDEX IF NOT EXISTS paddle_webhook_events_event_id_uniq
  ON public.paddle_webhook_events (event_id)
  WHERE event_id IS NOT NULL;