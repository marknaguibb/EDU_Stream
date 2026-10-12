const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const sql = require("mssql");

const rawServer = process.env.DB_SERVER || "";
const [server, serverInstance] = rawServer.split("\\", 2);
const instanceName = process.env.DB_INSTANCE || serverInstance;

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server,
  database: process.env.DB_NAME,
  ...(process.env.DB_PORT && !instanceName ? { port: Number(process.env.DB_PORT) } : {}),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // true for Azure SQL
    trustServerCertificate: process.env.DB_TRUST_CERT === "true", // true for local dev
    ...(instanceName ? { instanceName } : {}),
  },
};

// A single shared connection pool, reused across all requests.
let poolPromise;

function getPool() {
  if (!poolPromise) {
    const missingSettings = ["DB_USER", "DB_PASSWORD", "DB_SERVER", "DB_NAME"].filter(
      (name) => !process.env[name]
    );
    if (missingSettings.length > 0) {
      const error = new Error(
        `Missing database configuration: ${missingSettings.join(", ")}. Create Server/.env from .env.example and fill in your SQL Server settings.`
      );
      error.code = "DB_CONFIG_MISSING";
      throw error;
    }

    poolPromise = sql.connect(config).then((pool) => {
      console.log("Connected to SQL Server");
      return pool;
    }).catch((err) => {
      poolPromise = null; // allow retry on next request instead of staying broken forever
      throw err;
    });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
