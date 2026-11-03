require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser clients (curl, REST clients) with no Origin header
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());

// ---- API routes -----------------------------------------------------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));

// ---- System ---------------------------------------------------------------
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.get("/", (req, res) => {
  res.send("SAIL VRS Backend Running");
});

// ---- 404 + error handler ----------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`SAIL VRS backend running on http://localhost:${PORT}`);
});
