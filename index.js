const puppeteer = require("puppeteer");

async function extractVideoSrc(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const videoElement = await page.$("video"); // replace with your specific CSS selector
  const videoSrc = await videoElement.evaluate((el) => el.getAttribute("src"));
  await browser.close();
  return videoSrc;
}

extractVideoSrc(
  "https://www.xmegadrive.com/videos/goddess-foot-domination-who-is-in-control-now-starring-sophia-leone/"
).then((src) => {
  console.log(`The video source is: ${src}`);
});
