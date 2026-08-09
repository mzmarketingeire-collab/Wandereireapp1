-- One-time fix for an admin account created while email confirmation was enabled.
-- Replace ADMIN_EMAIL_PLACEHOLDER manually for each environment before running.
-- Never commit a real email address to this file.
-- This keeps the same user ID, password, profile and admin role.

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = lower('ADMIN_EMAIL_PLACEHOLDER')
returning id, email, email_confirmed_at;

select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('ADMIN_EMAIL_PLACEHOLDER');
