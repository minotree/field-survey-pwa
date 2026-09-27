CREATE POLICY "authenticated select access" ON survey_locations FOR SELECT USING (request.auth.role() = 'authenticated');
CREATE POLICY "authenticated insert access" ON survey_locations FOR INSERT WITH CHECK (request.auth.role() = 'authenticated');
