-- Fix events that have created_by = NULL by assigning them to the oldest admin user.
-- This resolves the issue where events are invisible due to the RLS policy
-- requiring "created_by = auth.uid()" but some events were created with NULL created_by.

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the oldest user (the original admin account)
  SELECT id INTO admin_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    UPDATE public.events
    SET created_by = admin_id
    WHERE created_by IS NULL;

    RAISE NOTICE 'Updated events with NULL created_by to user: %', admin_id;
  ELSE
    RAISE NOTICE 'No users found - skipping update.';
  END IF;
END $$;
