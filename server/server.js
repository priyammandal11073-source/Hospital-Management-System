import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

// Load variables from server/.env before reading process.env.
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware that applies to every incoming request.
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Temporary route to confirm that the API is running.
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Hospital Management API is running" });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
