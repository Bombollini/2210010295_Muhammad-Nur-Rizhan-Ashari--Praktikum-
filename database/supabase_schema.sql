-- Enable RLS
-- Enable RLS on auth.users is handled by Supabase by default or requires superuser.
-- We skip it here to avoid error 42501.


-- PROFILES TABLE (Extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'teacher', 'student')) default 'student',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- STUDENTS TABLE
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  nis text unique not null,
  name text not null,
  class_id uuid, -- foreign key added later after classes table creation
  photo_url text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.students enable row level security;

-- CLASSES TABLE
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  teacher_id uuid references public.profiles(id),
  capacity int default 30,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.classes enable row level security;

-- Add FK to students
alter table public.students add constraint fk_class foreign key (class_id) references public.classes(id);

-- SUBJECTS TABLE
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subjects enable row level security;

-- SCHEDULES TABLE
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) not null,
  subject_id uuid references public.subjects(id) not null,
  teacher_id uuid references public.profiles(id),
  day_of_week text check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.schedules enable row level security;

-- ATTENDANCE TABLE
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) not null,
  class_id uuid references public.classes(id) not null,
  date date not null,
  status text check (status in ('present', 'absent', 'late', 'excused')) default 'present',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attendance enable row level security;

-- POINTS LOG TABLE
create table public.points_log (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) not null,
  type text check (type in ('positive', 'negative')) not null,
  points int not null,
  description text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.points_log enable row level security;

-- STORAGE BUCKET FOR AVATARS
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- RLS POLICIES (Simple Starter Policies - Adjust as needed)

-- Profiles: Anyone can view, User can update own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Students: Authenticated users can view, Only Admins/Teachers can update
-- Students: Authenticated users can perform all CRUD operations
create policy "Authenticated users can view students" on public.students for select using (auth.role() = 'authenticated');
-- Note: 'admin' and 'teacher' roles checks would typically involve joining specific permissions tables or checking metadata.
-- For simplicity here, we allow authenticated inserts/updates locally, but real app should restrict this via app logic or stricter RLS with role helper functions.

-- TRIGGER: Create Profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student'); -- Default role
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
