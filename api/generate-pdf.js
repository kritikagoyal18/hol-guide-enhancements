import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentPage } = req.body;
    const baseUrl = req.headers.origin;
    
    console.log('Generating PDF for:', baseUrl + currentPage);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    // Get navigation structure
    const navUrl = `${baseUrl}/left-nav.plain.html`;
    await page.goto(navUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Extract all page URLs
    const pageUrls = await page.evaluate(() => {
      const links = document.querySelectorAll('.nav-heading li a');
      return Array.from(links).map(link => link.getAttribute('href'));
    });
    
    console.log('Found pages:', pageUrls.length);
    
    // Create PDF content
    let pdfContent = '';
    
    // Add current page first
    await page.goto(`${baseUrl}${currentPage}`, { waitUntil: 'networkidle0', timeout: 30000 });
    const currentPageContent = await page.evaluate(() => {
      // Remove unwanted elements
      const elementsToRemove = ['header', 'footer', '.next-button', '.nav-sections', '.nav-tools', 'script', '.nav-wrapper'];
      elementsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
      
      const main = document.querySelector('main');
      return main ? main.innerHTML : '';
    });
    
    pdfContent += currentPageContent;
    
    // Add other pages
    for (const pageUrl of pageUrls) {
      if (pageUrl === currentPage) continue;
      
      console.log('Processing page:', pageUrl);
      
      await page.goto(`${baseUrl}${pageUrl}`, { waitUntil: 'networkidle0', timeout: 30000 });
      const pageContent = await page.evaluate(() => {
        // Remove unwanted elements
        const elementsToRemove = ['header', 'footer', '.next-button', '.nav-sections', '.nav-tools', 'script', '.nav-wrapper'];
        elementsToRemove.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        const main = document.querySelector('main');
        return main ? main.innerHTML : '';
      });
      
      pdfContent += `<div style="page-break-before: always;"></div>${pageContent}`;
    }
    
    // Generate PDF
    await page.setContent(`
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
              color: #333;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              display: block;
              margin: 10px 0;
            }
            pre { 
              background: #f4f4f4; 
              padding: 15px; 
              overflow-x: auto; 
              border-radius: 5px;
              border: 1px solid #ddd;
            }
            code { 
              font-family: 'Courier New', monospace; 
              background: #f4f4f4;
              padding: 2px 4px;
              border-radius: 3px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #2e3d52;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            p, li {
              color: #4b5563;
              margin-bottom: 10px;
            }
            a {
              color: #136ff6;
              text-decoration: underline;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>${pdfContent}</body>
      </html>
    `);
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
      displayHeaderFooter: false
    });
    
    await browser.close();
    
    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="guide.pdf"');
    res.send(pdf);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF generation failed: ' + error.message });
  }
}