-- Adicionar campos Plano e Dia de Vencimento nos atletas
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS plan_id varchar REFERENCES plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_day integer;

-- Recriar plan_charges sem a coluna athlete_plan_id (que é da lógica antiga)
-- Como a tabela foi criada recentemente e está vazia, fazemos DROP e CREATE
DROP TABLE IF EXISTS athlete_plans CASCADE;
DROP TABLE IF EXISTS plan_charges CASCADE;

CREATE TABLE "plan_charges" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "athlete_id" varchar NOT NULL REFERENCES "athletes"("id") ON DELETE CASCADE,
  "plan_id" varchar REFERENCES "plans"("id") ON DELETE SET NULL,
  "charge_date" text NOT NULL,
  "description" text NOT NULL,
  "attendance_count" integer NOT NULL DEFAULT 1,
  "amount" numeric(10,2) NOT NULL,
  "is_paid" text NOT NULL DEFAULT 'nao',
  "paid_at" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
