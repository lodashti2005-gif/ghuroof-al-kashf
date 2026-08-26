-- تأكد من صلاحيات الجداول المطلوبة للشراء ومنح الملكية
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_purchases TO service_role;
GRANT SELECT ON public.case_purchases TO authenticated;
