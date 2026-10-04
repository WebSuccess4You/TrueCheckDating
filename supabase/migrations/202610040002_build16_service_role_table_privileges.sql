-- Build 16: record server permissions required by trusted application code.
begin;

grant usage on schema public to service_role;
grant select, insert, update, delete
  on all tables in schema public
  to service_role;

commit;
