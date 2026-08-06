-- One-time fix for the admin account created while email confirmation was enabled.
-- This keeps the same user ID, password, profile and admin role.

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = lower('markhoare28@gmail.com')
returning id, email, email_confirmed_at;

select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('markhoare28@gmail.com');
