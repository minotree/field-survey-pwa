CREATE POLICY "authenticated select access" ON survey_locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated insert access" ON survey_locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
