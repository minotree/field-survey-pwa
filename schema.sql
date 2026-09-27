CREATE TABLE survey_locations (
  id SERIAL PRIMARY KEY,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy INTEGER,
  address TEXT,
  original_photo_url TEXT,
  stamped_photo_url TEXT,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
