const express = require("express");
const { sql, getPool } = require("../db");

const router = express.Router();

function handleDatabaseError(res, err, message) {
  console.error(err);
  const errorMessage =
    err.code === "DB_CONFIG_MISSING" ? err.message : message;
  return res.status(500).json({ error: errorMessage });
}

// GET /api/categories            -> every category (left panel default view)
// GET /api/categories?subject=X   -> categories for one subject only
router.get("/categories", async (req, res) => {
  const { subject } = req.query;

  try {
    const pool = await getPool();
    const request = pool.request();
    let where = "";
    if (subject) {
      request.input("Subject", sql.VarChar, subject);
      where = "WHERE gc.Subject = @Subject";
    }
    const result = await request.query(`
        SELECT
          gc.CategoryID, gc.Title AS CategoryTitle, gc.Subject,
          t.TaskID, t.TaskName, t.TaskType, t.MaxGrade
        FROM GradeCategories gc
        LEFT JOIN Tasks t ON t.CategoryID = gc.CategoryID
        ${where}
        ORDER BY gc.Title, t.TaskName
      `);

    // Reshape flat rows into { categoryId, title, subject, children: [...] }
    const categories = {};
    for (const row of result.recordset) {
      if (!categories[row.CategoryID]) {
        categories[row.CategoryID] = {
          id: row.CategoryID,
          title: row.CategoryTitle,
          subject: row.Subject,
          children: [],
        };
      }
      if (row.TaskID) {
        categories[row.CategoryID].children.push({
          id: row.TaskID,
          title: row.TaskName,
          type: row.TaskType,
          max: row.MaxGrade,
        });
      }
    }
    res.json(Object.values(categories));
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load categories");
  }
});

// GET /api/items?classId=Advanced Mathematics
// Grading-item dropdown: only items belonging to the selected class.
router.get("/items", async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ error: "classId is required" });

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Class", sql.VarChar, classId)
      .query(`
        SELECT t.TaskID, t.CategoryID, t.TaskName, t.TaskType, t.MaxGrade
        FROM Tasks t
        JOIN GradeCategories gc ON gc.CategoryID = t.CategoryID
        WHERE t.Class = @Class
        ORDER BY t.TaskName
      `);
    res.json(result.recordset);
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load items");
  }
});

// GET /api/students?classId=Advanced Mathematics
// List students in a class, before any grading item is picked.
router.get("/students", async (req, res) => {
  const { classId } = req.query;

  try {
    const request = (await getPool()).request();
    let where = "";
    if (classId) {
      request.input("Class", sql.VarChar, classId);
      where = "WHERE Class = @Class";
    }
    const result = await request.query(`
      SELECT StudentID, FirstName, LastName, Email, Subject, Class, EnrollmentDate
      FROM Students
      ${where}
      ORDER BY LastName, FirstName
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load students");
  }
});

router.get("/content", async (_req, res) => {
  try {
    const result = await (await getPool()).request().query(`
      SELECT ContentID, Title, ContentType, Subject, Class, UploadDate
      FROM Content
      ORDER BY UploadDate DESC, Title
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load content");
  }
});

router.get("/videos", async (_req, res) => {
  try {
    const result = await (await getPool()).request().query(`
      SELECT
        p.PlaylistID, p.PlaylistTitle, p.YouTubePlaylistLink,
        p.Subject, p.PlaylistCategory, p.CreatedAt, s.Class
      FROM StudentYouTubePlaylist p
      LEFT JOIN Students s ON s.StudentID = p.StudentID
      ORDER BY p.CreatedAt DESC, p.PlaylistTitle
    `);
    res.json(result.recordset);
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load videos");
  }
});

// GET /api/classes -> classes currently represented in the student table.
router.get("/classes", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT DISTINCT Class AS ClassName
      FROM Students
      WHERE Class IS NOT NULL AND LTRIM(RTRIM(Class)) <> ''
      ORDER BY Class
    `);
    res.json(result.recordset.map((row) => row.ClassName));
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load classes");
  }
});

router.get("/summary", async (_req, res) => {
  try {
    const result = await (await getPool()).request().query(`
      SELECT
        (SELECT COUNT(*) FROM Students) AS StudentCount,
        (SELECT COUNT(*) FROM Tasks) AS TaskCount,
        (SELECT COUNT(*) FROM Content) AS ContentCount,
        (SELECT COUNT(*) FROM StudentYouTubePlaylist) AS PlaylistCount,
        (
          SELECT COUNT(*)
          FROM Students s
          INNER JOIN Tasks t ON t.Class = s.Class
          LEFT JOIN GradeStudents gs
            ON gs.StudentID = s.StudentID AND gs.TaskID = t.TaskID
          WHERE gs.GradeID IS NULL
        ) AS PendingGradeCount
    `);
    const row = result.recordset[0];
    res.json({
      students: row.StudentCount,
      gradingItems: row.TaskCount,
      content: row.ContentCount,
      playlists: row.PlaylistCount,
      pendingGrades: row.PendingGradeCount,
    });
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load dashboard summary");
  }
});

// GET /api/grades?taskId=101&classId=Advanced Mathematics
// Student grades table for a chosen grading item.
router.get("/grades", async (req, res) => {
  const { taskId, classId } = req.query;
  if (!taskId || !classId) {
    return res.status(400).json({ error: "taskId and classId are required" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("TaskID", sql.Int, taskId)
      .input("Class", sql.VarChar, classId)
      .query(`
        SELECT
          s.StudentID, s.FirstName, s.LastName, gs.GradeObtained,
          CASE WHEN gs.GradeObtained IS NULL THEN 'Pending' ELSE 'Graded' END AS Status
        FROM Students s
        LEFT JOIN GradeStudents gs
          ON gs.StudentID = s.StudentID AND gs.TaskID = @TaskID
        WHERE s.Class = @Class
        ORDER BY s.LastName, s.FirstName
      `);
    res.json(result.recordset);
  } catch (err) {
    handleDatabaseError(res, err, "Failed to load grades");
  }
});

// POST /api/grades  { studentId, taskId, grade }
// Insert or update a single student's grade. Rejects grades above the item's max.
router.post("/grades", async (req, res) => {
  const { studentId, taskId, grade } = req.body;
  if (studentId == null || taskId == null || !Object.hasOwn(req.body, "grade")) {
    return res.status(400).json({ error: "studentId, taskId, and grade are required" });
  }
  if (!Number.isInteger(Number(studentId)) || !Number.isInteger(Number(taskId))) {
    return res.status(400).json({ error: "studentId and taskId must be integers" });
  }
  if (grade !== null && (!Number.isFinite(Number(grade)) || typeof grade === "boolean")) {
    return res.status(400).json({ error: "grade must be a number or null" });
  }

  try {
    const pool = await getPool();

    if (grade === null) {
      await pool
        .request()
        .input("StudentID", sql.Int, Number(studentId))
        .input("TaskID", sql.Int, Number(taskId))
        .query(`
          DELETE FROM GradeStudents
          WHERE StudentID = @StudentID AND TaskID = @TaskID
        `);
      return res.json({ success: true });
    }

    const maxResult = await pool
      .request()
      .input("TaskID", sql.Int, Number(taskId))
      .query("SELECT MaxGrade FROM Tasks WHERE TaskID = @TaskID");

    if (maxResult.recordset.length === 0) {
      return res.status(404).json({ error: "Grading item not found" });
    }
    const maxGrade = maxResult.recordset[0].MaxGrade;
    const numericGrade = Number(grade);
    if (numericGrade < 0 || numericGrade > maxGrade) {
      return res.status(400).json({ error: `Grade must be between 0 and ${maxGrade}` });
    }

    await pool
      .request()
      .input("StudentID", sql.Int, Number(studentId))
      .input("TaskID", sql.Int, Number(taskId))
      .input("GradeObtained", sql.Decimal(6, 2), numericGrade)
      .query(`
        MERGE GradeStudents AS target
        USING (SELECT @StudentID AS StudentID, @TaskID AS TaskID, @GradeObtained AS GradeObtained) AS source
        ON target.StudentID = source.StudentID AND target.TaskID = source.TaskID
        WHEN MATCHED THEN
          UPDATE SET GradeObtained = source.GradeObtained, SubmissionDate = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (StudentID, TaskID, GradeObtained, SubmissionDate)
          VALUES (source.StudentID, source.TaskID, source.GradeObtained, GETDATE());
      `);

    res.json({ success: true });
  } catch (err) {
    handleDatabaseError(res, err, "Failed to save grade");
  }
});

// POST /api/categories  { title, subject }
router.post("/categories", async (req, res) => {
  const { title, subject } = req.body;
  if (!title || !subject) {
    return res.status(400).json({ error: "title and subject are required" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Title", sql.VarChar, title)
      .input("Subject", sql.VarChar, subject)
      .query(`
        INSERT INTO GradeCategories (Title, Subject)
        OUTPUT INSERTED.CategoryID
        VALUES (@Title, @Subject)
      `);
    res.status(201).json({ id: result.recordset[0].CategoryID });
  } catch (err) {
    handleDatabaseError(res, err, "Failed to add category");
  }
});

// POST /api/items  { categoryId, taskName, taskType, maxGrade, subject, classId, weight }
router.post("/items", async (req, res) => {
  const { categoryId, taskName, taskType, maxGrade, subject, classId, weight } = req.body;
  if (!categoryId || !taskName || !maxGrade) {
    return res.status(400).json({ error: "categoryId, taskName, and maxGrade are required" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("CategoryID", sql.Int, categoryId)
      .input("TaskName", sql.VarChar, taskName)
      .input("TaskType", sql.VarChar, taskType || "Quiz")
      .input("MaxGrade", sql.Decimal(6, 2), maxGrade)
      .input("Subject", sql.VarChar, subject || null)
      .input("Class", sql.VarChar, classId || null)
      .input("Weight", sql.Decimal(5, 2), weight || 0)
      .query(`
        INSERT INTO Tasks (CategoryID, TaskName, TaskType, MaxGrade, Subject, Class, Weight)
        OUTPUT INSERTED.TaskID
        VALUES (@CategoryID, @TaskName, @TaskType, @MaxGrade, @Subject, @Class, @Weight)
      `);
    res.status(201).json({ id: result.recordset[0].TaskID });
  } catch (err) {
    handleDatabaseError(res, err, "Failed to add grading item");
  }
});

// PUT /api/categories/:id  { title, subject }
router.put("/categories/:id", async (req, res) => {
  const { title, subject } = req.body;
  if (!title || !subject) {
    return res.status(400).json({ error: "title and subject are required" });
  }

  try {
    const pool = await getPool();
    await pool
      .request()
      .input("CategoryID", sql.Int, req.params.id)
      .input("Title", sql.VarChar, title)
      .input("Subject", sql.VarChar, subject)
      .query(`
        UPDATE GradeCategories
        SET Title = @Title, Subject = @Subject
        WHERE CategoryID = @CategoryID
      `);
    res.json({ success: true });
  } catch (err) {
    handleDatabaseError(res, err, "Failed to update category");
  }
});

// PUT /api/items/:id  { taskName, taskType, maxGrade }
router.put("/items/:id", async (req, res) => {
  const { taskName, taskType, maxGrade } = req.body;
  if (!taskName || !maxGrade) {
    return res.status(400).json({ error: "taskName and maxGrade are required" });
  }

  try {
    const pool = await getPool();
    await pool
      .request()
      .input("TaskID", sql.Int, req.params.id)
      .input("TaskName", sql.VarChar, taskName)
      .input("TaskType", sql.VarChar, taskType || "Quiz")
      .input("MaxGrade", sql.Decimal(6, 2), maxGrade)
      .query(`
        UPDATE Tasks
        SET TaskName = @TaskName, TaskType = @TaskType, MaxGrade = @MaxGrade
        WHERE TaskID = @TaskID
      `);
    res.json({ success: true });
  } catch (err) {
    handleDatabaseError(res, err, "Failed to update grading item");
  }
});

module.exports = router;
