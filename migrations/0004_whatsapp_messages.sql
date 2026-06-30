CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  athlete_id varchar NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  phone text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'manual',
  sent_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_athlete ON whatsapp_messages(athlete_id);
