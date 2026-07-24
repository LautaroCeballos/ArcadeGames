-- Enable Realtime for the notifications table
-- Without this, Supabase Realtime will not broadcast INSERT/UPDATE events
-- and the live notification badge/dropdown in the header will not update.
alter publication supabase_realtime add table notifications;
