import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, 'Log2space-App-User-Guide.html');
const pdfPath = join(__dirname, 'Log2space-App-User-Guide.pdf');

const puppeteer = await import('puppeteer');
const browser = await puppeteer.default.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 60000 });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
});
await browser.close();
console.log('Created:', pdfPath);
