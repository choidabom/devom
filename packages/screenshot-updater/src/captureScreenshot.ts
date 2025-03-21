import puppeteer from "puppeteer";

export async function captureScreenshot(url: string, outputPath: string) {
  const browser = await puppeteer.launch();

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
