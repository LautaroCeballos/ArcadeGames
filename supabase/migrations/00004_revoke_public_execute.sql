-- Revoke EXECUTE from PUBLIC on SECURITY DEFINER functions
-- These functions are called internally (triggers, server actions) and
-- should not be exposed via the REST API
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.award_badge(uuid, text) from public;
revoke execute on function public.recalc_owner_stars(uuid) from public;
