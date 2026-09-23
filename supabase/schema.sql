-- EcoMap Samarinda Supabase Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (User profiles synced with Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'warga' check (role in ('warga', 'admin')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LAPORAN SAMPAH TABLE (Waste Reports)
create table if not exists public.laporan_sampah (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  kecamatan text not null,
  kelurahan text,
  foto_url text,
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Armada Dikirim', 'Selesai/Dibersihkan')),
  urgensi text not null default 'Sedang' check (urgensi in ('Kritis', 'Sedang', 'Normal')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ARMADA TABLE (DLH Cleanliness Trucks / Fleets)
create table if not exists public.armada (
  id uuid default uuid_generate_v4() primary key,
  nama_armada text not null,
  plat_nomor text not null,
  nama_petugas text not null,
  telepon text not null,
  status text not null default 'Tersedia' check (status in ('Tersedia', 'Bertugas', 'Perawatan')),
  kecamatan_tugas text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTIFIKASI TABLE (User Notifications)
create table if not exists public.notifikasi (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  judul text not null,
  pesan text not null,
  dibaca boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.laporan_sampah enable row level security;
alter table public.armada enable row level security;
alter table public.notifikasi enable row level security;

-- Profiles: Anyone can view, user can update own profile
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Laporan Sampah: Anyone can view, authenticated users can insert, owner/admin can update
create policy "Reports viewable by everyone" on public.laporan_sampah for select using (true);
create policy "Users can insert reports" on public.laporan_sampah for insert with check (true);
create policy "Admins and owners can update reports" on public.laporan_sampah for update using (true);

-- Armada: Public viewable, admin updatable
create policy "Armada viewable by everyone" on public.armada for select using (true);

-- Notifikasi: Users can see their own notifications
create policy "Users view own notifications" on public.notifikasi for select using (auth.uid() = user_id);

-- Storage Bucket Setup for Photos
-- insert into storage.buckets (id, name, public) values ('foto-laporan', 'foto-laporan', true);
