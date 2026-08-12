-- Klinikos Supabase workspace smoke test.
-- This deliberately tests only the isolated development workspace contract.

select case
  when current_database() is not null then true
  else false
end as database_available;
