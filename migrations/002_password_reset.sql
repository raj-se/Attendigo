alter table instructors
  add column if not exists reset_token_hash text,
  add column if not exists reset_token_expires_at timestamptz;
