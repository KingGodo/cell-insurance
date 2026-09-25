const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const slides = ["01-open.html", "02-problem.html", "03-solution.html", "04-risk.html", "05-value.html"];
const out = path.join(__dirname, "thumbnails");
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  for (const file of slides) {
    await page.goto(pathToFileURL(path.join(__dirname, "slides", file)));
    await page.screenshot({ path: path.join(out, file.replace(".html", ".png")) });
  }
  await browser.close();
})();

function pathToFileURL(file) {
  return "file:///" + file.replace(/\\/g, "/");
}
