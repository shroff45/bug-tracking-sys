## 2025-03-03 - [SQL Injection in Dynamic Query Builder]
**Vulnerability:** The `PUT /api/bugs/:id` endpoint used unvalidated object keys from `req.body` directly in an SQL `UPDATE` statement string (`SET ${key} = ?`). This allows an attacker to pass arbitrary SQL commands via JSON keys.
**Learning:** In this codebase, dynamic SQL updates are being performed by directly iterating over request bodies. This pattern requires strictly whitelisting allowed columns before dynamically building query strings to prevent SQL injection.
**Prevention:** Always validate object keys against a hardcoded array of allowed database columns (e.g. `['title', 'description', 'status']`) before appending them to raw SQL queries.
