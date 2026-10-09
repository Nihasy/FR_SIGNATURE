-- FR Signature Auto — schéma initial
-- Tables publiques : catégories, séries (albums), photos, réglages du site.
-- Messages du formulaire de contact : écriture publique, lecture admin uniquement.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Administrateurs
-- ─────────────────────────────────────────────────────────────
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Catégories
-- ─────────────────────────────────────────────────────────────
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 400),
  sort_order integer not null default 0
);

-- ─────────────────────────────────────────────────────────────
-- Séries (albums)
-- ─────────────────────────────────────────────────────────────
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 120),
  subtitle text check (char_length(subtitle) <= 160),
  description text check (char_length(description) <= 4000),
  category text references public.categories (slug) on update cascade on delete set null,
  location text check (char_length(location) <= 120),
  event_date date,
  cover_photo_id uuid,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger albums_touch before update on public.albums
for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Photos
-- path / thumb_path : clés dans le bucket « photos »
-- blur : mini aperçu base64 (placeholder pendant le chargement)
-- ─────────────────────────────────────────────────────────────
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  thumb_path text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  bytes integer not null default 0 check (bytes >= 0),
  blur text check (char_length(blur) <= 4000),
  title text check (char_length(title) <= 160),
  alt text check (char_length(alt) <= 300),
  category text references public.categories (slug) on update cascade on delete set null,
  album_id uuid references public.albums (id) on delete set null,
  featured boolean not null default false,
  hero boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  original_name text check (char_length(original_name) <= 255),
  created_at timestamptz not null default now()
);

alter table public.albums
  add constraint albums_cover_fk foreign key (cover_photo_id)
  references public.photos (id) on delete set null;

create index photos_public_idx on public.photos (published, sort_order, created_at desc);
create index photos_album_idx on public.photos (album_id, sort_order);
create index photos_category_idx on public.photos (category);

-- ─────────────────────────────────────────────────────────────
-- Réglages du site (une seule ligne)
-- ─────────────────────────────────────────────────────────────
create table public.settings (
  id integer primary key default 1 check (id = 1),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  whatsapp text check (char_length(whatsapp) <= 40),
  instagram_url text check (char_length(instagram_url) <= 300),
  facebook_url text check (char_length(facebook_url) <= 300),
  linkedin_url text check (char_length(linkedin_url) <= 300),
  location text check (char_length(location) <= 120),
  availability text check (char_length(availability) <= 300),
  updated_at timestamptz not null default now()
);

create trigger settings_touch before update on public.settings
for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Messages (formulaire de contact)
-- ─────────────────────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 40),
  company text check (char_length(company) <= 120),
  service text check (char_length(service) <= 120),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_created_idx on public.messages (created_at desc);

-- Anti-abus simple : 3 messages max par e-mail sur 10 minutes, 30 au total par heure.
create or replace function public.throttle_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.messages
      where lower(email) = lower(new.email) and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'too_many_messages' using errcode = 'P0001';
  end if;
  if (select count(*) from public.messages where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'too_many_messages' using errcode = 'P0001';
  end if;
  new.read := false;
  new.created_at := now();
  return new;
end;
$$;

create trigger messages_throttle before insert on public.messages
for each row execute function public.throttle_messages();

-- ─────────────────────────────────────────────────────────────
-- Droits & RLS
-- ─────────────────────────────────────────────────────────────
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.settings enable row level security;
alter table public.messages enable row level security;

grant select on public.categories, public.albums, public.photos, public.settings to anon, authenticated;
grant insert, update, delete on public.categories, public.albums, public.photos to authenticated;
grant update on public.settings to authenticated;
grant insert on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;
grant select on public.admins to authenticated;

create policy "admins: lire sa propre ligne" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "categories: lecture publique" on public.categories
  for select using (true);
create policy "categories: admin écrit" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "albums: lecture publiée ou admin" on public.albums
  for select using (published or (select public.is_admin()));
create policy "albums: admin insère" on public.albums
  for insert to authenticated with check ((select public.is_admin()));
create policy "albums: admin modifie" on public.albums
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "albums: admin supprime" on public.albums
  for delete to authenticated using ((select public.is_admin()));

create policy "photos: lecture publiée ou admin" on public.photos
  for select using (published or (select public.is_admin()));
create policy "photos: admin insère" on public.photos
  for insert to authenticated with check ((select public.is_admin()));
create policy "photos: admin modifie" on public.photos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "photos: admin supprime" on public.photos
  for delete to authenticated using ((select public.is_admin()));

create policy "settings: lecture publique" on public.settings
  for select using (true);
create policy "settings: admin modifie" on public.settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "messages: tout le monde peut écrire" on public.messages
  for insert to anon, authenticated with check (true);
create policy "messages: admin lit" on public.messages
  for select to authenticated using ((select public.is_admin()));
create policy "messages: admin modifie" on public.messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "messages: admin supprime" on public.messages
  for delete to authenticated using ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- Stockage : bucket public « photos », écriture réservée à l'admin
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 15728640, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "photos bucket: admin lit" on storage.objects
  for select to authenticated using (bucket_id = 'photos' and (select public.is_admin()));
create policy "photos bucket: admin dépose" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos' and (select public.is_admin()));
create policy "photos bucket: admin remplace" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and (select public.is_admin()))
  with check (bucket_id = 'photos' and (select public.is_admin()));
create policy "photos bucket: admin supprime" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and (select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- Données de départ
-- ─────────────────────────────────────────────────────────────
insert into public.categories (slug, name, description, sort_order) values
  ('automobile', 'Automobile', 'Sportives, premium, détails et design automobile.', 1),
  ('moto', 'Moto', 'Grosses cylindrées, portraits de pilotes, lifestyle.', 2),
  ('competition', 'Compétition', 'Motocross, rallye, essais chronométrés : action et filés.', 3),
  ('sorties', 'Sorties & rassemblements', 'Randonnées, balades et communautés de passionnés.', 4),
  ('evenementiel', 'Événementiel', 'Lancements, expositions, événements partenaires.', 5),
  ('corporate', 'Corporate', 'Showrooms, concessions et communication de marque.', 6);

insert into public.settings (id, email, phone, whatsapp, instagram_url, facebook_url, linkedin_url, location, availability)
values (
  1,
  'fraoilison@gmail.com',
  '+261 34 01 711 58',
  '+261340171158',
  null,
  null,
  'https://www.linkedin.com/in/raoilison-faniry-9b46ba249/',
  'Antananarivo, Madagascar',
  'Disponible pour des collaborations ponctuelles, régulières ou des partenariats à long terme.'
);
