const pptxgen = require("pptxgenjs");
const html2pptx = require("C:/Users/Baller/.cursor/skills/document-skills/pptx/scripts/html2pptx.js");
const path = require("path");

const slides = ["01-open.html", "02-problem.html", "03-solution.html", "04-risk.html", "05-value.html"];

async function main() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = "CustomerIQ";
  pptx.author = "CustomerIQ";
  pptx.subject = "Profile the client. Intervene before they leave.";

  for (const file of slides) {
    await html2pptx(path.join(__dirname, "slides", file), pptx);
  }

  const out = path.join(__dirname, "..", "CustomerIQ.pptx");
  await pptx.writeFile({ fileName: out });
  console.log(out);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
