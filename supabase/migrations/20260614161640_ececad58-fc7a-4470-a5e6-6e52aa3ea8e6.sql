
CREATE POLICY "receipts_student_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "receipts_owner_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'director')));
CREATE POLICY "receipts_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-receipts' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'director')));
CREATE POLICY "receipts_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-receipts' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'director')));
