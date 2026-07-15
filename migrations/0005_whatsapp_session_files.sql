CREATE TABLE IF NOT EXISTS whatsapp_session_files (
  name text PRIMARY KEY,
  content text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);
