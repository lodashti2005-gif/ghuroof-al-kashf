ALTER TABLE public.case_purchases
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'KWD',
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS provider_invoice_id text,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.case_purchases SET status = 'pending'
WHERE status NOT IN ('pending','paid','failed','cancelled');

ALTER TABLE public.case_purchases DROP CONSTRAINT IF EXISTS case_purchases_status_check;
ALTER TABLE public.case_purchases
  ADD CONSTRAINT case_purchases_status_check
  CHECK (status IN ('pending','paid','failed','cancelled'));

CREATE INDEX IF NOT EXISTS case_purchases_provider_ref_idx
  ON public.case_purchases (provider, provider_ref);
