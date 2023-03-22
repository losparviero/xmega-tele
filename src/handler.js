const puppeteer = require("puppeteer");
const fs = require("fs");

async function extractVideoSrc(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url);
  const videoElement = await page.$("video");
  const videoSrc = await videoElement.evaluate((el) => el.getAttribute("src"));
  const response = await page.goto(videoSrc);

  await browser.close();
  return videoSrc;
}

async function saveVideo(fileName, buffer, callback) {
  const path = require("path");
  const rootDir = path.resolve(__dirname);
  await fs.promises.writeFile(path.join(rootDir, fileName), buffer);
  callback();
}

module.exports = { extractVideoSrc };
