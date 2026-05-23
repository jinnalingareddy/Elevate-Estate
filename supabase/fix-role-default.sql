-- Fix: change default role from 'buyer' to 'agent' for new signups
alter table public.profiles alter column role set default 'agent';

-- Fix existing users who were assigned 'buyer' by the old default
update public.profiles set role = 'agent' where role = 'buyer';
