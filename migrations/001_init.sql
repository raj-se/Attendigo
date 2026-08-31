create extension if not exists "pgcrypto";

create table if not exists instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references instructors(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists classes_instructor_id_idx on classes(instructor_id);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  roll_number text not null,
  created_at timestamptz not null default now(),
  unique (class_id, roll_number)
);

create index if not exists students_class_id_idx on students(class_id);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_class_id_idx on sessions(class_id);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  marked_at timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  distance_meters double precision not null,
  unique (session_id, student_id)
);

create index if not exists attendance_session_id_idx on attendance(session_id);
