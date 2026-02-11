const path = require("path");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const activityRoutes = require("./routes/activities");

const app = express();

/* ==============================
   Middleware
============================== */

app.use(cors());
app.use(express.json());

/* ==============================
   MongoDB Connection
============================== */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

/* ==============================
   API Routes (MUST COME FIRST)
============================== */

app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);

/* ==============================
   Serve Frontend (Option A)
   Make sure frontend files are
   inside backend/public/
============================== */

app.use(express.static(path.join(__dirname, "public")));

/* ==============================
   Fallback Route (Express 5 Safe)
   This handles SPA routing safely
============================== */

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ==============================
   Create HTTP Server + Socket.io
============================== */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

require("./sockets/socketHandler")(io);

/* ==============================
   Start Server (Render Compatible)
============================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
