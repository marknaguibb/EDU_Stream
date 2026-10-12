const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const gradesRouter = require("./routes/grades");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", gradesRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

function startServer() {
  const PORT = process.env.PORT || 4000;
  return app.listen(PORT, () => {
    console.log(`EduStream API running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
