create table if not exists public.anamnesi_rm_lombosacrale (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_code text not null,
  patient_age int not null check (patient_age > 0),
  radiologist_email text not null,
  questionnaire_payload jsonb not null,
  appropriateness_level text not null,
  appropriateness_score int not null,
  recommendation text not null
);

create index if not exists idx_anamnesi_rm_created_at
  on public.anamnesi_rm_lombosacrale (created_at desc);
