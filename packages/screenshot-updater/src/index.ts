import * as dotenv from "dotenv";
import { captureScreenshot } from "./captureScreenshot";

dotenv.config();

async function main() {
  try {
    const blogURL = process.env.BLOG_URL;
    if (!blogURL) {
      throw new Error("URL is not defined in .env file");
    }
    await captureScreenshot(blogURL, "blog.png");
  } catch (error) {
    console.error("Error in screenshot capturing. ", error);
  }
}

main();
