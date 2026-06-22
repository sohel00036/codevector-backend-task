#  200k Products Pagination API

A high-performance Node.js backend demonstrating cursor-based pagination for real-time data feeds. 

##  Why I Built It This Way

1. Cursor Pagination > Offset Pagination
Traditional `OFFSET` fails when new data is injected frequently. If 50 products are added while a user is on Page 1, a standard `OFFSET 20` will push the original items down, causing the user to see duplicates on Page 2. I used a **Keyset Cursor** `(created_at, id)` to drop an exact anchor in the database, ensuring zero duplicates regardless of data drift.

2. PostgreSQL & Composite B-Tree Indexes
I chose Postgres because it natively supports Row-Value Comparison `(created_at, id) < ($1, $2)`, keeping the query clean. To make sorting 200,000 rows instant, I created two specific indexes:
 `idx_products_category_time_id (category, created_at DESC, id DESC)` for lightning-fast category filtering.
 `idx_products_time_id (created_at DESC, id DESC)` for the global feed.

3. O(1) Bulk Seeding
Instead of a slow `for` loop that hits the database 200,000 times, the `seed.js` script uses PostgreSQL's native `unnest()` array function. It performs a single bulk insert, seeding all 200k rows in ~20 seconds.

4. Production-Ready Touches
 Execution Timers: The API response includes a `meta.executionTime` field to prove the query resolves in milliseconds.
 Graceful Error Handling: Invalid or tampered base64 cursors return a clean `400 Bad Request` instead of crashing the server.

##  Tech Stack
 Node.js / Express
 PostgreSQL (Neon)
 `pg` driver