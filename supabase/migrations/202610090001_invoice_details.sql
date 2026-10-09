create table if not exists public.invoice_details (
  commitment text primary key,
  seller text not null,
  buyer text not null,
  face_amount bigint not null,
  due_date bigint not null,
  items jsonb not null,
  description text not null,
  salt text not null,
  created_at timestamptz not null default now()
);

alter table public.invoice_details enable row level security;
revoke all on table public.invoice_details from anon, authenticated;
grant select, insert on table public.invoice_details to service_role;
