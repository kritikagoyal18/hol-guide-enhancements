import { getMetadata } from "../../scripts/aem.js";

let counter = 0;

async function generatePDF() {
  // First, dynamically load html2pdf.js
  await loadHTML2PDF();

  // Get all pages from left navigation
  const leftNavMeta = getMetadata('left-nav');
  const leftNavPath = leftNavMeta ? new URL(leftNavMeta).pathname : '/left-nav';
  const resp = await fetch(`${leftNavPath}.plain.html`);
  
  if (resp.ok) {
    const html = await resp.text();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Create PDF content
    const pdfContent = document.createElement('div');
    
    // Add index page from navigation
    const indexPage = createIndexPage(tempDiv);
    pdfContent.appendChild(indexPage);
    
    // Get all page links
    const links = tempDiv.querySelectorAll('li a');
    
    // Fetch and add content of each page
    for (const link of links) {
      const pageUrl = link.getAttribute('href');
      const pageContent = await fetchPageContent(pageUrl);
      pdfContent.appendChild(pageContent);
    }
    
    // Configure PDF options
    const options = {
      margin: 10,
      filename: 'guide.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF using the global html2pdf object
    window.html2pdf().from(pdfContent).set(options).save();
  }
}

// Function to load html2pdf.js dynamically
function loadHTML2PDF() {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Helper function to create index page
function createIndexPage(nav) {
  const index = document.createElement('div');
  index.className = 'pdf-index';
  // Convert navigation structure to index
  // ... implementation ...
  return index;
}

// Helper function to fetch and clean page content
async function fetchPageContent(url) {
  const resp = await fetch(url);
  const html = await resp.text();
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove header, footer, and navigation elements
  tempDiv.querySelector('header')?.remove();
  tempDiv.querySelector('footer')?.remove();
  tempDiv.querySelector('.next-button')?.remove();
  
  return tempDiv.querySelector('main');
}

export default function downloadPdfEvent() {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.dispatchEvent(new Event('sidekick-ready'));
    }, 3000);
  });

  document.addEventListener('sidekick-ready', () => {
    const sidekick = document.querySelector('aem-sidekick');
    if (sidekick) {
      sidekick.addEventListener('custom:downloadPdf', () => {
        if (counter === 0) {
          generatePDF();
        }
        counter++;
        if (counter === 5) {
          counter = 0;
        }
      });
    }
  });
}