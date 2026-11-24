-- ═══════════════════════════════════════════════════════════════
-- جودة العقارية — موقع العقارات (aqarat.html)
-- شغّل هذا الملف مرة واحدة في Supabase → SQL Editor
-- كل الأوامر آمنة للتكرار (if not exists) ولا تحذف أي بيانات.
-- ═══════════════════════════════════════════════════════════════

-- 1) أعمدة جديدة في جدول العقارات
alter table public.properties add column if not exists property_type     text default 'apartment';
alter table public.properties add column if not exists status_changed_at timestamptz;
alter table public.properties add column if not exists description_ar    text;
alter table public.properties add column if not exists floor             text;

-- 2) السماح بالحالات الجديدة: active / inactive / rented / sold
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.properties'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.properties drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.properties
  add constraint properties_status_check
  check (status in ('active','inactive','rented','sold','draft')) not valid;

-- 3) تسجيل وقت تغيّر الحالة تلقائياً (يستخدمه الموقع لإخفاء المؤجّر بعد مدة)
create or replace function public.touch_property_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_property_status on public.properties;
create trigger trg_property_status
  before insert or update on public.properties
  for each row execute function public.touch_property_status();

-- 4) جدول التنبيهات: عميل يطلب إشعار لما ينزل عقار يناسبه
create table if not exists public.property_alerts (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  phone         text not null,
  property_type text,
  district      text,
  max_budget    numeric,
  min_beds      int,
  notes         text,
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);
alter table public.property_alerts enable row level security;

drop policy if exists "public can subscribe to alerts" on public.property_alerts;
create policy "public can subscribe to alerts" on public.property_alerts
  for insert to anon, authenticated
  with check (char_length(phone) between 8 and 20 and char_length(coalesce(notes,'')) <= 500);

drop policy if exists "staff read alerts" on public.property_alerts;
create policy "staff read alerts" on public.property_alerts
  for select to authenticated using (true);

drop policy if exists "staff update alerts" on public.property_alerts;
create policy "staff update alerts" on public.property_alerts
  for update to authenticated using (true) with check (true);

drop policy if exists "staff delete alerts" on public.property_alerts;
create policy "staff delete alerts" on public.property_alerts
  for delete to authenticated using (true);

-- 5) إعداد افتراضي: العقار المؤجّر يختفي من القائمة الرئيسية فوراً (0 ساعة)
insert into public.site_settings (key, value)
values ('listing_hide_after_hours', '0')
on conflict (key) do nothing;
