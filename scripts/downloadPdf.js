import { getMetadata } from "./aem.js";

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
    console.log('Fetching navigation from:', `${leftNavPath}.plain.html`);
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
    
    // Get all content sections from the main content
    const sections = tempDiv.querySelectorAll('div > div');
    if (!sections.length) {
      console.error('No sections found in', plainUrl);
      return null;
    }

    // Create a wrapper for the content
    const contentSection = document.createElement('div');
    contentSection.className = 'pdf-section';
    
    // Process each section
    sections.forEach((section, index) => {
      if (section.classList.contains('next-button-container')) {
        return;
      }

      const sectionClone = section.cloneNode(true);

      // Clean up the section
      const elementsToRemove = [
        'header',
        'footer',
        'aside',
        '.next-button-container',
        '.floating-btn',
        '.modal',
        '.sidekick',
        'aem-sidekick'
      ];

      elementsToRemove.forEach(selector => {
        sectionClone.querySelectorAll(selector).forEach(el => el.remove());
      });

      // Process images
      sectionClone.querySelectorAll('img').forEach(img => {
        // Convert relative image paths to absolute
        if (img.src && (img.src.startsWith('./') || img.src.startsWith('/'))) {
          const urlParts = plainUrl.split('/');
          urlParts.pop(); // Remove the filename
          const basePath = urlParts.join('/');
          img.src = img.src.replace(/^[./]+/, `${basePath}/`);
        }
        
        // Process image styles
        processImage(img);
      });

      // Add spacing between sections
      if (index > 0) {
        sectionClone.style.marginTop = '2em';
      }

      // Add page break hints for headings
      sectionClone.querySelectorAll('h1, h2').forEach(heading => {
        heading.classList.add('page-break-before');
      });

      // Prevent breaks within important elements
      const noBreakElements = sectionClone.querySelectorAll('pre, table, .note, .tip, figure');
      noBreakElements.forEach(elem => {
        elem.style.pageBreakInside = 'avoid';
        elem.style.breakInside = 'avoid';
      });

      contentSection.appendChild(sectionClone);
    });
    return contentSection;
  } catch (error) {
    console.error(`Error fetching page ${url}:`, error);
    return null;
  }
}

export default function downloadPdfEvent() {
  if (!isListenerAttached) {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        document.dispatchEvent(new Event('sidekick-ready'));
      }, 3000);
    });

    document.addEventListener('sidekick-ready', () => {
      const sidekick = document.querySelector('aem-sidekick');
      if (sidekick && !isListenerAttached) {
        sidekick.addEventListener('custom:downloadPdf', async () => {
          if (isGenerating) {
            console.log('PDF generation already in progress');
            return;
          }

          try {
            isGenerating = true;
            const progressModal = createProgressModal();

            // Load PDF styles
            await loadPdfStyles();
            updateProgress(progressModal, 'Loading pages list...');

            // Get all page URLs
            const pageUrls = await getAllPageUrls();
            
            if (!pageUrls.length) {
              throw new Error('No pages found to generate PDF');
            }

            // Create the main container
            const pdfContainer = document.createElement('div');
            pdfContainer.className = 'pdf-container';

            // Create content wrapper
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'pdf-content';

            // Fetch and process each page
            let processedPages = 0;
            let successfulPages = 0;
            
            for (const url of pageUrls) {
              updateProgress(
                progressModal,
                `Processing page ${processedPages + 1} of ${pageUrls.length}...`,
                (processedPages / pageUrls.length) * 100
              );

              const pageContent = await fetchPageContent(url);
              if (pageContent) {
                contentWrapper.appendChild(pageContent);
                successfulPages++;
              }
              processedPages++;
              //if (processedPages == 2) break;
            }

            if (successfulPages === 0) {
              throw new Error('No content was successfully processed');
            }

            pdfContainer.appendChild(contentWrapper);
            console.log('Final --- PDF container structure:', pdfContainer.innerHTML);

            // Create temporary container
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.appendChild(pdfContainer);
            document.body.appendChild(tempContainer);

            updateProgress(progressModal, 'Generating PDF...');

            // Configure PDF options
            const opt = {
              margin: 15,
              filename: 'guide.pdf',
              pagebreak: {
                mode: ['css', 'legacy'],
                avoid: ['tr', 'img', 'pre', 'table', '.note', '.tip', 'figure'],
                after: ['.page-break-after'],
                before: ['.page-break-before']
              },
              html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true,
                scrollY: 0,
                windowWidth: document.documentElement.clientWidth,
                windowHeight: document.documentElement.scrollHeight,
                backgroundColor: '#ffffff',
                logging: true,
                onclone: function(clonedDoc) {
                  const container = clonedDoc.querySelector('.pdf-container');
                  if (container) {
                    container.style.width = '100%';
                    container.style.maxWidth = 'none';
                    container.style.margin = '0';
                    container.style.padding = '0';
                    container.style.minHeight = '100%';
                  }
                  
                  // Ensure content is not cut off
                  const content = clonedDoc.querySelector('.pdf-content');
                  if (content) {
                    content.style.width = '100%';
                    content.style.margin = '0';
                    content.style.padding = '15px';
                    content.style.boxSizing = 'border-box';
                    content.style.minHeight = '100%';
                  }
                  // Add page break hints
                  clonedDoc.querySelectorAll('h1, h2').forEach(heading => {
                    heading.classList.add('page-break-before');
                  });

                  // Prevent breaks within important elements
                  const noBreakElements = clonedDoc.querySelectorAll('pre, table, .note, .tip, figure');
                  noBreakElements.forEach(elem => {
                    elem.style.pageBreakInside = 'avoid';
                    elem.style.breakInside = 'avoid';
                  });
                }
              },
              jsPDF: { 
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true,
                hotfixes: ['px_scaling'],
                enableLinks: true
              }
            };

            // Generate PDF
            await html2pdf()
              .set(opt)
              .from(pdfContainer)
              .save();

            // Clean up
            document.body.removeChild(tempContainer);
            document.body.removeChild(progressModal);
            
          } catch (error) {
            console.error('Error generating PDF:', error);
            // const progressModal = document.querySelector('.pdf-progress-modal');
            // if (progressModal) {
            //   updateProgress(progressModal, `Error: ${error.message}`);
            //   setTimeout(() => {
            //     document.body.removeChild(progressModal);
            //   }, 3000);
            // }
          } finally {
            isGenerating = false;
          }
        });

        isListenerAttached = true;
        console.log('PDF download event listener attached');
      }
    });
  }
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

// Helper function to process images
function processImage(img) {
  img.classList.add('pdf-image');
  
  // If image is in a figure, process the figure
  const figure = img.closest('figure');
  if (figure) {
    figure.classList.add('avoid-break');
  }
}

