# EduStream Backend

A small Express API that sits between the React frontend and SQL Server,
backing the "Manage Grades" screen.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` in the `Server` folder and fill in your SQL Server credentials:
   ```
   Copy-Item .env.example .env
   ```
   Set `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`, and (for SQL Server Express)
   `DB_INSTANCE`. Do not use the sample login values as real credentials. For a
   named instance, SQL Server Browser and TCP/IP must be enabled, or configure a
   fixed `DB_PORT` and use the server host without an instance name.

3. Run the SQL schema files against your database first (`edustream_schema.sql`),
   so the tables this API queries actually exist.

4. Start the server:
   ```
   npm start
   ```
   It runs on `http://localhost:4000` by default.

The React app calls this API; it does not connect directly to SQL Server. Its
default API URL is `http://localhost:4000/api`. If you change the server port
or host, set `VITE_API_URL` in the Client environment and restart Vite. Use
`GET http://localhost:4000/health` to check that the API process is running;
database-backed endpoints require valid `.env` settings and the schema below.

## Endpoints

| Method | Path                              | Purpose                                      |
|--------|------------------------------------|-----------------------------------------------|
| GET    | `/api/categories?subject=X`        | Categories + grading items for a subject       |
| GET    | `/api/classes`                     | Classes present in the Students table           |
| GET    | `/api/students?classId=X`           | Students, optionally filtered by class          |
| GET    | `/api/content`                      | Content records                                 |
| GET    | `/api/videos`                       | Student YouTube playlist records                |
| GET    | `/api/summary`                      | Dashboard counts from database tables           |
| GET    | `/api/items?classId=X`             | Grading items for a specific class             |
| GET    | `/api/grades?taskId=X&classId=Y`   | Students + their grade for one grading item    |
| POST   | `/api/grades`                      | Save one student's grade (upsert)              |
| POST   | `/api/categories`                  | Add a new category                             |
| POST   | `/api/items`                       | Add a new grading item                         |
| GET    | `/health`                          | Health check (no DB call)                      |

## Connecting from React

In `ManageGrades.jsx`, replace the local mock state with `fetch` calls to
these endpoints, e.g.:

```js
fetch(`http://localhost:4000/api/grades?taskId=${activeItem.id}&classId=${selectedClass}`)
  .then(res => res.json())
  .then(data => { /* set grades state */ });
```

To save a grade:

```js
fetch("http://localhost:4000/api/grades", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ studentId, taskId: activeItem.id, grade: value }),
});
```
