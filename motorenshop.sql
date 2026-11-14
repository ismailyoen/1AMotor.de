-- 1A Motor – Vorbereitung für den Partner-Import motorenshop.eu (14.11.2026)
-- Einmal im Supabase-SQL-Editor ausführen. Kann gefahrlos wiederholt werden.

-- 1) Zwei neue Spalten an den Inseraten:
--    external_url    = Link zum Originalangebot (Ziel des „Kaufen“-Buttons)
--    external_source = woher das Inserat stammt (z. B. 'motorenshop.eu')
alter table public.listings add column if not exists external_url    text;
alter table public.listings add column if not exists external_source text;

-- 2) Jedes Originalangebot nur einmal pro Verkäufer (verhindert Doppelte beim erneuten Import)
create unique index if not exists listings_seller_external_url_uniq
  on public.listings (seller_id, external_url)
  where external_url is not null;

create index if not exists listings_external_source_idx
  on public.listings (external_source)
  where external_source is not null;
