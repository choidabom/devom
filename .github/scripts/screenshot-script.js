import puppeteer from "puppeteer";

async function captureScreenshot(url, outputPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-web-security", "--disable-features=VizDisplayCompositor"],
    executablePath: process.env.CHROME_BIN || undefined,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const fullHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportWidth = 1280;
    const halfHeight = Math.floor(fullHeight / 2);
    await page.setViewport({ width: viewportWidth, height: fullHeight });

    await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: viewportWidth, height: halfHeight } });
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}: `, error);
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    const blogURL = process.env.BLOG_URL;
    if (!blogURL) {
      throw new Error("BLOG_URL environment variable is not defined");
    }
    await captureScreenshot(blogURL, "blog.png");
    console.log("Screenshot captured successfully");
  } catch (error) {
    console.error("Error in screenshot capturing: ", error);
    process.exit(1);
  }
}

main();
