import * as dotenv from "dotenv";
import connectToDatabase from "./db/index.js";

dotenv.config({ path: "./env" });

connectToDatabase()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log("Database connection failed:", error);
    process.exit(1);
  });
