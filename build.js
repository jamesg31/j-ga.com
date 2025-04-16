const fs = require("fs");
const path = require("path");
const CleanCSS = require("clean-css");
const { minify } = require("terser");

async function minifyFiles() {
  // Create dist directory if it doesn't exist
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }

  // Minify CSS
  const cssContent = fs.readFileSync(path.join("src", "styles.css"), "utf8");
  const minifiedCss = new CleanCSS().minify(cssContent).styles;
  fs.writeFileSync(path.join("dist", "styles.min.css"), minifiedCss);

  // Minify JS
  const jsContent = fs.readFileSync(path.join("src", "terminal.js"), "utf8");
  const minifiedJs = await minify(jsContent);
  fs.writeFileSync(path.join("dist", "terminal.min.js"), minifiedJs.code);

  // Copy HTML and update references
  let htmlContent = fs.readFileSync(path.join("src", "index.html"), "utf8");
  htmlContent = htmlContent
    .replace("styles.css", "styles.min.css")
    .replace("terminal.js", "terminal.min.js");
  fs.writeFileSync(path.join("dist", "index.html"), htmlContent);

  // Copy favicon
  // fs.copyFileSync("favicon.png", path.join("dist", "favicon.png"));

  console.log("Build completed successfully!");
}

minifyFiles().catch(console.error);
