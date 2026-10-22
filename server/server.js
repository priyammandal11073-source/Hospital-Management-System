import connectDB from "./config/db.js";
import env from "./config/env.js";
import createApp from "./app.js";

const app = createApp();

const startServer = async () => {
  await connectDB();

  // Listen on port when running locally or standalone container
  if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
    });
  }
};

startServer();

export default app;