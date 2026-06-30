-- Plans table
CREATE TABLE IF NOT EXISTS "plans" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Athlete Plans (enrollments)
CREATE TABLE IF NOT EXISTS "athlete_plans" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "athlete_id" varchar NOT NULL REFERENCES "athletes"("id") ON DELETE CASCADE,
  "plan_id" varchar NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "start_date" text NOT NULL,
  "status" text NOT NULL DEFAULT 'ativo',
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Plan Charges (sessions / monthly charges)
CREATE TABLE IF NOT EXISTS "plan_charges" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "athlete_plan_id" varchar NOT NULL REFERENCES "athlete_plans"("id") ON DELETE CASCADE,
  "charge_date" text NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "is_paid" text NOT NULL DEFAULT 'nao',
  "paid_at" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
