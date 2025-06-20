import { getMetadata } from './aem.js';

// Flag to track if PDF generation is in progress
let isGenerating = false;
// Flag to track if event listener is attached
let isListenerAttached = false;

// Helper function to create a progress modal
function createProgressModal() {
  const modal = document.createElement('div');
  modal.className = 'pdf-progress-modal';
  modal.innerHTML = `
    <div class="pdf-progress-content">
      <h3>Generating PDF</h3>
      <div class="pdf-progress-status">Preparing...</div>
      <div class="pdf-progress-bar">
        <div class="pdf-progress-fill"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

// Helper function to update progress
function updateProgress(modal, status, progress) {
  const statusEl = modal.querySelector('.pdf-progress-status');
  const progressFill = modal.querySelector('.pdf-progress-fill');
  statusEl.textContent = status;
  if (progress !== undefined) {
    progressFill.style.width = `${progress}%`;
  }
}

// Helper function to extract all page URLs from navigation
async function getAllPageUrls() {
  const urls = [];
  const leftNavMeta = getMetadata('left-nav');
  const leftNavPath = leftNavMeta ? new URL(leftNavMeta).pathname : '/left-nav';
  
  try {
    const resp = await fetch(`${leftNavPath}.plain.html`);
    if (!resp.ok) throw new Error('Failed to load navigation');
    
    const html = await resp.text();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get all links from the navigation
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        urls.push(href);
      }
    });
    
  } catch (error) {
    console.error('Error getting page URLs:', error);
  }
  
  return urls;
}

// Helper function to fetch and process page content
async function fetchPageContent(url) {
  try {
    const plainUrl = `${url}${url.endsWith('.plain.html') ? '' : '.plain.html'}`;
    const resp = await fetch(plainUrl);
    if (!resp.ok) {
      console.error(`Failed to fetch ${plainUrl}, status: ${resp.status}`);
      return null;
    }
    
    const html = await resp.text();
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const mainContent = tempDiv.querySelector(':scope > div');
    if (!mainContent) {
      console.error('No main content found in', plainUrl);
      return null;
    }

    const elementsToRemove = [
      'header', 'footer', 'aside', '.next-button-container', 
      '.floating-btn', '.modal', '.sidekick', 'aem-sidekick'
    ];
    elementsToRemove.forEach(selector => {
      mainContent.querySelectorAll(selector).forEach(el => el.remove());
    });

    mainContent.querySelectorAll('img').forEach(img => {
      if (img.src && (img.src.startsWith('./') || img.src.startsWith('/'))) {
        const urlParts = plainUrl.split('/');
        urlParts.pop();
        const basePath = urlParts.join('/');
        img.src = img.src.replace(/^[./]+/, `${basePath}/`);
      }
    });
    
    const contentSection = document.createElement('div');
    contentSection.className = 'pdf-section';
    contentSection.appendChild(mainContent);
    return contentSection;
  } catch (error) {
    console.error(`Error fetching page ${url}:`, error);
    return null;
  }
}

export default function downloadPdfEvent() {
  if (isListenerAttached) {
    return;
  }
  isListenerAttached = true;

  document.addEventListener('sidekick-ready', () => {
    const sidekick = document.querySelector('aem-sidekick');
    if (!sidekick) return;

    sidekick.addEventListener('custom:downloadPdf', async () => {
      if (isGenerating) {
        console.log('PDF generation already in progress');
        return;
      }
      isGenerating = true;

      const progressModal = createProgressModal();
      try {
        await loadPdfStyles();
        updateProgress(progressModal, 'Loading pages list...');
        const pageUrls = await getAllPageUrls();
        if (!pageUrls.length) {
          throw new Error('No pages found to generate PDF');
        }

        let pdf;
        let processedPages = 0;
        const totalPages = pageUrls.length;

        for (const url of pageUrls) {
          processedPages++;
          updateProgress(
            progressModal,
            `Processing page ${processedPages} of ${totalPages}...`,
            (processedPages / totalPages) * 100,
          );

          try {
            // eslint-disable-next-line no-await-in-loop
            const pageContent = await fetchPageContent(url);
            if (!pageContent) {
              // eslint-disable-next-line no-continue
              continue;
            }

            const pdfContainer = document.createElement('div');
            pdfContainer.className = 'pdf-container';
            pdfContainer.appendChild(pageContent);
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '210mm'; // A4 paper width
            tempContainer.appendChild(pdfContainer);
            document.body.appendChild(tempContainer);

            const A4_RATIO = 297 / 210;
            const contentWidth = pdfContainer.clientWidth;
            const pageHeightInPixels = contentWidth * A4_RATIO;
            const contentHeight = pdfContainer.scrollHeight;

            let yOffset = 0;
            while (yOffset < contentHeight) {
              const remainingHeight = contentHeight - yOffset;
              const captureHeight = Math.min(pageHeightInPixels, remainingHeight);

              const options = {
                html2canvas: {
                  scale: 2,
                  useCORS: true,
                  letterRendering: true,
                  backgroundColor: '#ffffff',
                  y: yOffset,
                  height: captureHeight,
                  windowHeight: contentHeight,
                },
              };

              // eslint-disable-next-line no-await-in-loop
              const worker = window.html2pdf().from(pdfContainer).set(options);
              // eslint-disable-next-line no-await-in-loop
              const canvas = await worker.toCanvas().get('canvas');

              if (!pdf) {
                // First ever canvas, use it to create the master PDF.
                // eslint-disable-next-line no-await-in-loop
                pdf = await worker.toPdf().get('pdf');
              } else {
                // We already have a PDF, just add a new page with the canvas image.
                const imgData = canvas.toDataURL('image/png');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const margin = 15;
                const pdfImageWidth = pdfWidth - margin * 2;
                const pdfImageHeight = (canvas.height / canvas.width) * pdfImageWidth;

                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, margin, pdfImageWidth, pdfImageHeight);
              }
              
              yOffset += pageHeightInPixels;
            }
            document.body.removeChild(tempContainer);
          } catch (e) {
            console.error(`Failed to process page: ${url}`, e);
          }
        }

        if (pdf) {
          updateProgress(progressModal, 'Saving PDF...');
          pdf.save('guide.pdf');
        } else {
          throw new Error('No content was successfully processed into the PDF.');
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        isGenerating = false;
        const modal = document.querySelector('.pdf-progress-modal');
        if (modal) {
          document.body.removeChild(modal);
        }
      }
    });
  });
}

// Helper function to load PDF styles
async function loadPdfStyles() {
  if (!document.querySelector('link[href*="pdf-styles.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/pdf-styles.css';
    return new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  return Promise.resolve();
} 