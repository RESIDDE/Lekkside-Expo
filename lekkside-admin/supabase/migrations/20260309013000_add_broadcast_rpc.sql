-- Function to safely increment stats
CREATE OR REPLACE FUNCTION increment_broadcast_stats(row_id UUID, field TEXT)
RETURNS VOID AS $$
BEGIN
  IF field = 'open_count' THEN
    UPDATE broadcasts SET open_count = open_count + 1 WHERE id = row_id;
  ELSIF field = 'click_count' THEN
    UPDATE broadcasts SET click_count = click_count + 1 WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
