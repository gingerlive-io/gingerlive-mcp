-- MCP usage report. Run: npm run usage   (reads production D1)
-- 1. Daily volume
SELECT substr(ts,1,10) AS day, COUNT(DISTINCT session_id) AS sessions, COUNT(*) AS calls
FROM tool_calls GROUP BY day ORDER BY day DESC LIMIT 30;
-- 2. Tools by usage and error count
SELECT tool, COUNT(*) AS calls, SUM(is_error) AS errors FROM tool_calls GROUP BY tool ORDER BY calls DESC;
-- 3. Clients and countries
SELECT client_name, country, COUNT(DISTINCT session_id) AS sessions FROM tool_calls
GROUP BY client_name, country ORDER BY sessions DESC LIMIT 30;
-- 4. Session journeys (tool sequence per conversation)
SELECT session_id, MIN(ts) AS started, client_name, GROUP_CONCAT(tool, ' > ') AS journey
FROM (SELECT * FROM tool_calls ORDER BY ts) GROUP BY session_id ORDER BY started DESC LIMIT 50;
-- 5. What people are trying to do, plus misses
SELECT ts, tool, is_error, intent, args FROM tool_calls
WHERE intent IS NOT NULL OR is_error = 1 ORDER BY ts DESC LIMIT 200;
