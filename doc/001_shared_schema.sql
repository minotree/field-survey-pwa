-- Walk Fit shared foundation v2.0 / 2026-09-23
-- Apply ONCE only to a NEW, empty Supabase project after manual review.
-- Development order: Field Survey PWA -> Admin -> User App.

begin;

create table public.exercise_sites (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address_text text not null default '',
  toilet_status text not null default 'unknown' check (toilet_status in ('yes','no','unknown')),
  drinking_water_status text not null default 'unknown' check (drinking_water_status in ('yes','no','unknown')),
  amenity_note text not null default '',
  last_verified_at date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  model_name text not null default '',
  default_image_path text,
  instructions text not null default '',
  effects text not null default '',
  precautions text not null default '',
  source_reference text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_published_content_check check (not is_published or (char_length(btrim(instructions)) > 0 and char_length(btrim(effects)) > 0))
);

create table public.site_equipment (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.exercise_sites(id) on delete restrict,
  equipment_id uuid not null references public.equipment_catalog(id) on delete restrict,
  site_image_path text,
  quantity integer not null default 1 check (quantity >= 1),
  display_order integer not null default 0 check (display_order >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_equipment_site_model_unique unique (site_id, equipment_id)
);

create table public.survey_locations (
  id uuid primary key default gen_random_uuid(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy double precision check (accuracy is null or accuracy >= 0),
  address text not null default '',
  original_photo_path text,
  stamped_photo_path text,
  taken_at timestamptz,
  review_status text not null default 'new' check (review_status in ('new','reviewed','imported','rejected')),
  review_note text not null default '',
  linked_site_id uuid references public.exercise_sites(id) on delete set null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index site_equipment_site_order_idx on public.site_equipment(site_id, display_order, id);
create index site_equipment_equipment_idx on public.site_equipment(equipment_id);
create index survey_locations_status_created_idx on public.survey_locations(review_status, created_at desc);

create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;

create trigger exercise_sites_touch_updated_at before update on public.exercise_sites for each row execute function public.touch_updated_at();
create trigger equipment_catalog_touch_updated_at before update on public.equipment_catalog for each row execute function public.touch_updated_at();
create trigger site_equipment_touch_updated_at before update on public.site_equipment for each row execute function public.touch_updated_at();
create trigger survey_locations_touch_updated_at before update on public.survey_locations for each row execute function public.touch_updated_at();

alter table public.exercise_sites enable row level security;
alter table public.equipment_catalog enable row level security;
alter table public.site_equipment enable row level security;
alter table public.survey_locations enable row level security;

revoke all on public.exercise_sites, public.equipment_catalog, public.site_equipment, public.survey_locations from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.exercise_sites, public.equipment_catalog, public.site_equipment to anon, authenticated;

create policy exercise_sites_public_read on public.exercise_sites for select to anon, authenticated using (is_published);
create policy equipment_catalog_public_read on public.equipment_catalog for select to anon, authenticated using (is_published);
create policy site_equipment_public_read on public.site_equipment for select to anon, authenticated using (is_published and exists (select 1 from public.exercise_sites s where s.id=site_equipment.site_id and s.is_published) and exists (select 1 from public.equipment_catalog e where e.id=site_equipment.equipment_id and e.is_published));

revoke all on function public.touch_updated_at() from public, anon, authenticated;
commit;
