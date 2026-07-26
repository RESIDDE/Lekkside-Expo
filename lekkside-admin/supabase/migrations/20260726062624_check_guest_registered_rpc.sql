CREATE OR REPLACE FUNCTION check_guest_registered(p_event_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.guests 
        WHERE event_id = p_event_id 
        AND email = p_email
    ) INTO v_exists;
    
    RETURN v_exists;
END;
$$;
