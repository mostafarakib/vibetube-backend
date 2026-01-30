import dotenv from "dotenv";
dotenv.config();

import connectToDatabase from "./config/db.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  });
