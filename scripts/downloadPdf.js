// Flag to track if PDF generation is in progress
let isGenerating = false;
// Flag to track if event listener is attached
let isListenerAttached = false;

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
            console.log('Starting PDF generation...');

            // Load PDF styles
            await loadPdfStyles();

            // Create the main container
            const pdfContainer = document.createElement('div');
            pdfContainer.className = 'pdf-container';

            // Create content wrapper
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'pdf-content';

            // Get all content sections
            const sections = document.querySelectorAll('main .section > div');
            if (sections.length) {
              // Process each section
              sections.forEach((section, index) => {
                if (section.classList.contains('next-button-container')) {
                  return; // Skip next button
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
                  // Ensure image is loaded before PDF generation
                  if (img.complete) {
                    processImage(img);
                  } else {
                    img.onload = () => processImage(img);
                  }
                });

                // Add spacing between sections
                if (index > 0) {
                  sectionClone.style.marginTop = '2em';
                }

                contentWrapper.appendChild(sectionClone);
              });
            }

            pdfContainer.appendChild(contentWrapper);

            // Create temporary container
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.appendChild(pdfContainer);
            document.body.appendChild(tempContainer);

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
                  // Ensure proper width for content
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
                  
                  console.log('Document cloned and prepared for PDF generation');
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
            
          } catch (error) {
            console.error('Error generating PDF:', error);
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
  img.style.maxWidth = '100%';
  img.style.height = 'auto';
  img.style.pageBreakInside = 'avoid';
  
  // If image is in a figure, process the figure
  const figure = img.closest('figure');
  if (figure) {
    figure.style.pageBreakInside = 'avoid';
    figure.style.margin = '1em 0';
  }
}

