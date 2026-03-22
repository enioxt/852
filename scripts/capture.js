const puppeteer = require('puppeteer');

const url = process.argv[2];
const outFile = process.argv[3];

if (!url || !outFile) {
  console.error("Usage: node capture.js <url> <outFile>");
  process.exit(1);
}

// Add protocol if missing
let finalUrl = url;
if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
  finalUrl = 'https://' + finalUrl;
}

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
    });
    const page = await browser.newPage();
    
    // Set a solid viewport so the page renders appropriately
    await page.setViewport({ width: 1920, height: 1080 });

    // Go to the URL and wait until network is mostly idle
    await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Attempt to wait a bit longer for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Capture the full scrolling page
    await page.screenshot({ path: outFile, fullPage: true });

    await browser.close();
    console.log("Success");
  } catch (error) {
    console.error("Error capturing page:", error);
    process.exit(1);
  }
})();
