CREATE POLICY "public read access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "authenticated insert access" ON storage.objects FOR INSERT WITH CHECK (request.auth.role() = 'authenticated');
