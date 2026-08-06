-- Wander Eire: seed the first guide and unlock admin CRUD/moderation.
-- Safe to run after schema.sql. Re-running this file is also safe.

alter table public.locations add column if not exists facts text[] not null default '{}';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Only the moderation field needs to be writable through the client API.
revoke update on public.comments from anon, authenticated;
grant update (status) on public.comments to authenticated;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
for select using (public.is_admin());

drop policy if exists "Admins can create locations" on public.locations;
create policy "Admins can create locations" on public.locations
for insert with check (public.is_admin());

drop policy if exists "Admins can update locations" on public.locations;
create policy "Admins can update locations" on public.locations
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read archived locations" on public.locations;
create policy "Admins can read archived locations" on public.locations
for select using (public.is_admin());

drop policy if exists "Admins can read all comments" on public.comments;
create policy "Admins can read all comments" on public.comments
for select using (public.is_admin());

drop policy if exists "Admins can moderate comments" on public.comments;
create policy "Admins can moderate comments" on public.comments
for update using (public.is_admin()) with check (public.is_admin());

insert into public.locations
  (id, name, county, category, latitude, longitude, cost, distance, kicker, description, address, parking, facts)
values
  (1, 'Glendalough Spinc Trail', 'Wicklow', 'trail', 53.006, -6.327, 'Free', '9.5 km loop', 'A high trail above two glacial lakes', 'Climb through the pine forest to a sweeping boardwalk over the Spinc ridge, with the Upper Lake opening below you and the Wicklow Mountains beyond.', 'Upper Lake Car Park, Glendalough, Co. Wicklow', 'Paid parking at the Upper Lake. Arrive before 10am on bright weekends.', array['3–4 hours', 'Hard', 'Dogs on lead']),
  (2, 'Dunluce Castle', 'Antrim', 'historic', 55.211, -6.579, '€6', '45 min visit', 'A cliff-edge castle with a wild history', 'Cross the narrow bridge to the dramatic ruins of Dunluce, perched above Atlantic caves and the Causeway Coast.', '87 Dunluce Road, Bushmills, BT57 8UY', 'Small free car park beside the visitor centre.', array['Ruins', 'Sea views', 'Family friendly']),
  (3, 'Cliffs of Moher', 'Clare', 'viewpoint', 52.971, -9.431, '€12 parking', '1–8 km', 'Ireland’s most famous Atlantic edge', 'Walk the clifftop path as dark shale walls rise over the Atlantic. On a clear day, the Aran Islands sit low on the horizon.', 'Cliffs of Moher, Liscannor, Co. Clare, V95 KN9T', 'Main visitor-centre parking includes admission. Book online for quieter times.', array['214 m high', 'Exposed path', 'Visitor centre']),
  (4, 'Inch Beach', 'Kerry', 'beach', 52.141, -9.981, 'Free', '5 km strand', 'A long golden strand on the Dingle peninsula', 'Walk, swim or watch surfers from this broad sandy spit with mountain views in almost every direction.', 'Inch, Co. Kerry', 'Park on the firm section of beach near the entrance; mind tide times.', array['Swimming', 'Surf hire', 'Dog friendly']),
  (5, 'Glenveagh National Park', 'Donegal', 'camp', 55.032, -8.004, 'Free entry', '8 km trail', 'Lakeside trails in Donegal’s mountain heart', 'Follow the valley road beside Lough Veagh to the castle gardens, surrounded by rugged Derryveagh peaks.', 'Church Hill, Letterkenny, Co. Donegal, F92 P993', 'Free visitor-centre car park. Shuttle to the castle runs seasonally.', array['Shuttle bus', 'Cafe', 'No wild camping']),
  (6, 'Slieve League', 'Donegal', 'viewpoint', 54.628, -8.685, '€5 parking', '2.8 km', 'Immense sea cliffs at the edge of Europe', 'A steep coastal viewpoint where the Donegal mountains fall straight into the Atlantic. The upper path is for confident walkers only.', 'Bunglas Road, Teelin, Co. Donegal', 'Lower car park with seasonal shuttle; limited access higher up.', array['601 m high', 'Steep', 'Shuttle available']),
  (7, 'Rock of Cashel', 'Tipperary', 'historic', 52.520, -7.891, '€8', '1 hour visit', 'A limestone crown above the Golden Vale', 'Explore a remarkable collection of medieval buildings gathered on a dramatic outcrop above Cashel town.', 'St. Patrick’s Rock, Cashel, Co. Tipperary', 'Paid public parking in Cashel, a short uphill walk away.', array['12th century', 'Guided tours', 'Indoor & outdoor'])
on conflict (id) do update set
  name = excluded.name,
  county = excluded.county,
  category = excluded.category,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  cost = excluded.cost,
  distance = excluded.distance,
  kicker = excluded.kicker,
  description = excluded.description,
  address = excluded.address,
  parking = excluded.parking,
  facts = excluded.facts;

select setval(
  pg_get_serial_sequence('public.locations', 'id'),
  greatest((select coalesce(max(id), 1) from public.locations), 1),
  true
);
