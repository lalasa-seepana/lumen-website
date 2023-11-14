-- Lumen website only. Services and consultation enquiries. No staff accounts or clinic logins.
-- Sample service rows below were created for this project.
-- Re-running this file does not change an existing service price or active flag.

create table if not exists public.services (
  id uuid primary key,
  name text not null,
  category text not null check (category in ('Heal Your Mind', 'Heal Your Body', 'Skin & Body Rituals')),
  description text,
  price_paise integer not null check (price_paise > 0),
  display_order integer not null,
  active boolean not null default true,
  unique (id, category)
);

create table if not exists public.consultation_enquiries (
  id uuid primary key default gen_random_uuid(),
  service_id uuid,
  category text not null check (category in ('Heal Your Mind', 'Heal Your Body', 'Skin & Body Rituals')),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  phone text,
  ai_call_consent boolean not null,
  consent_text text not null,
  consent_version text not null,
  consent_recorded_at timestamptz not null default now(),
  status text not null default 'enquiry_received' check (status = 'enquiry_received'),
  submission_id uuid not null unique,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  check (phone is null or (char_length(btrim(phone)) between 7 and 20 and btrim(phone) ~ '^\+?[0-9][0-9 ().-]{6,19}$')),
  foreign key (service_id, category) references public.services (id, category)
);

create index if not exists consultation_enquiries_created_idx on public.consultation_enquiries (created_at desc);

create table if not exists public.consultation_rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (bucket, window_start)
);

create or replace function public.guard_enquiry()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from public.services
    where category = new.category and active and price_paise is not null
  ) then
    raise exception 'service_unavailable' using errcode = '23514';
  end if;
  if new.service_id is not null and not exists (
    select 1 from public.services
    where id = new.service_id and category = new.category and active and price_paise is not null
  ) then
    raise exception 'service_unavailable' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists consultation_enquiries_guard on public.consultation_enquiries;
create trigger consultation_enquiries_guard
  before insert or update on public.consultation_enquiries
  for each row execute function public.guard_enquiry();

alter table public.services enable row level security;
alter table public.consultation_enquiries enable row level security;
alter table public.consultation_rate_limits enable row level security;
revoke all on table public.services, public.consultation_enquiries, public.consultation_rate_limits from public, anon, authenticated;
revoke all on function public.guard_enquiry() from public, anon, authenticated;

insert into public.services (id, name, category, description, price_paise, display_order)
values
  ('b1000000-0000-4000-8000-000000000001', 'Aroma Swedish Massage', 'Heal Your Mind', 'A gentle, aromatic ritual with flowing massage strokes.', 320000, 1),
  ('b1000000-0000-4000-8000-000000000002', 'Deep Tissue Massage', 'Heal Your Mind', 'Focused massage with a firmer, more intentional touch.', 380000, 2),
  ('b1000000-0000-4000-8000-000000000003', 'Balinese Massage', 'Heal Your Mind', 'A full-body ritual inspired by traditional Balinese techniques.', 460000, 3),
  ('b1000000-0000-4000-8000-000000000004', 'Ayurvedic Abhyanga', 'Heal Your Body', 'A traditional Ayurvedic ritual with warm oil and rhythmic touch.', 360000, 4),
  ('b1000000-0000-4000-8000-000000000005', 'Shirodhara', 'Heal Your Body', 'A traditional ritual centred on a gentle stream of warm oil.', 340000, 5),
  ('b1000000-0000-4000-8000-000000000006', 'Hot Stone Therapy', 'Heal Your Body', 'Smooth, warmed stones meet considered massage techniques.', 440000, 6),
  ('b1000000-0000-4000-8000-000000000007', 'Coffee Body Polish', 'Skin & Body Rituals', 'A coffee-inspired exfoliating body ritual.', 280000, 7),
  ('b1000000-0000-4000-8000-000000000008', 'Chocolate Body Wrap', 'Skin & Body Rituals', 'A cocooning body ritual with a rich cocoa-inspired wrap.', 390000, 8),
  ('b1000000-0000-4000-8000-000000000009', 'Vitamin C Facial', 'Skin & Body Rituals', 'A skin-focused facial ritual featuring vitamin C skincare.', 340000, 9)
on conflict (id) do nothing;
