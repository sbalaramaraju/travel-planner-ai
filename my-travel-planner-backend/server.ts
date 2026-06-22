import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./src/config/database.js";
import authRoutes from "./src/routes/auth.routes.js";
import tripRoutes from "./src/routes/trip.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core API endpoints
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    // Only attempt database connection if URI is supplied, otherwise log helpful error to prevent startup crashes
    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn("WARNING: MONGODB_URI environment variable is not defined. Ensure you declare this on Atlas/Vercel/Render.");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend API running successfully on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to: ", err);
  }
}

startServer();
