import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import createApp from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const app = createApp();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();