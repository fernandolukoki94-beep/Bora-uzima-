import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const migrationPath = new URL("../supabase/migrations/202608170001_foundation_profiles_projects.sql", import.meta.url);

const migration = await readFile(migrationPath, "utf8");

test("Supabase foundation defines profiles and projects", () => {
  assert.match(migration, /create table if not exists public\.profiles/i);
  assert.match(migration, /create table if not exists public\.projects/i);
  assert.match(migration, /references auth\.users \(id\) on delete cascade/i);
  assert.match(migration, /projects_owner_updated_idx/i);
});

test("Supabase foundation enables ownership and public visibility policies", () => {
  assert.match(migration, /alter table public\.profiles enable row level security/i);
  assert.match(migration, /alter table public\.projects enable row level security/i);
  assert.match(migration, /owner_id = \(select auth\.uid\(\)\) or visibility = 'public'/i);
  assert.match(migration, /with check \(owner_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(migration, /projects_delete_own/i);
});

test("Supabase foundation provisions profiles for new auth users", () => {
  assert.match(migration, /create or replace function public\.handle_new_user/i);
  assert.match(migration, /create trigger on_auth_user_created/i);
  assert.match(migration, /on conflict \(id\) do nothing/i);
});
