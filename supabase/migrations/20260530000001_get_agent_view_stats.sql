CREATE OR REPLACE FUNCTION get_agent_view_stats(p_agent_id uuid, p_days int DEFAULT 30)
RETURNS TABLE(stat_date date, view_count bigint) AS $$
  SELECT DATE(lv.viewed_at) AS stat_date, COUNT(*) AS view_count
  FROM listing_views lv
  JOIN listings l ON l.id = lv.listing_id
  WHERE l.agent_id = p_agent_id
    AND lv.viewed_at >= NOW() - (p_days || ' days')::interval
  GROUP BY DATE(lv.viewed_at)
  ORDER BY stat_date;
$$ LANGUAGE sql STABLE SECURITY INVOKER;
