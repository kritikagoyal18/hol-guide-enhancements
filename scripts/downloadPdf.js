import { getMetadata } from './aem.js';

// A flag to ensure the listeners are only attached once.
let isListenerAttached = false;

export default function downloadPdfEvent() {
  if (isListenerAttached) {
    return;
  }
  isListenerAttached = true;
  
  let isGenerating = false;

  // Function to load a CSS file
  const loadCSS = (href) => new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });

  // Listen for the custom event on the document body
  document.body.addEventListener('custom:downloadPdf', async () => {
    if (isGenerating) {
      console.log('PDF generation already in progress');
      return;
    }
    isGenerating = true;

    await loadCSS('/styles/pdf-styles.css');
    
    // Create and show the progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'pdf-progress-modal';
    progressModal.innerHTML = `
      <div class="pdf-progress-content">
        <div class="pdf-loader"></div>
        <h3 class="pdf-progress-status">Generating...</h3>
      </div>
    `;
    document.body.appendChild(progressModal);

    try {
      // 1. Get all page URLs from the navigation
      const leftNavMeta = getMetadata('left-nav');
      const leftNavPath = leftNavMeta ? new URL(leftNavMeta).pathname : '/left-nav';
      const navResp = await fetch(`${leftNavPath}.plain.html`);
      if (!navResp.ok) throw new Error('Failed to load navigation');
      const html = await navResp.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const pageUrls = [...tempDiv.querySelectorAll('a')]
        .map(a => a.getAttribute('href'))
        .filter(href => href && !href.startsWith('http') && !href.startsWith('#'))
        .map(href => new URL(href, window.location.origin).href);

      if (!pageUrls.length) {
        throw new Error('No pages found to generate PDF');
      }

      // 2. Call the server to generate the PDF
      const pdfResponse = await fetch('http://localhost:3001/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: pageUrls }),
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        throw new Error(`Server failed to generate PDF: ${errorText}`);
      }

      // 3. Download the received PDF blob
      const blob = await pdfResponse.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'guide.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update status to "Complete!"
      const statusEl = progressModal.querySelector('.pdf-progress-status');
      if (statusEl) statusEl.textContent = 'Complete!';

    } catch (error) {
      console.error('Error generating PDF:', error);
      const statusEl = progressModal.querySelector('.pdf-progress-status');
      if (statusEl) statusEl.textContent = `Error: ${error.message}`;
    } finally {
      // Keep the modal open for a moment to show the final status
      setTimeout(() => {
        isGenerating = false;
        if (progressModal) {
          document.body.removeChild(progressModal);
        }
      }, 2000);
    }
  });

  // The sidekick button will dispatch the event, which we now catch on the body
  document.addEventListener('sidekick-ready', () => {
    const sidekick = document.querySelector('aem-sidekick');
    if (sidekick && !sidekick.dataset.pdfListenerAttached) {
      sidekick.addEventListener('custom:downloadPdf', () => {
        document.body.dispatchEvent(new CustomEvent('custom:downloadPdf', { bubbles: true }));
      });
      sidekick.dataset.pdfListenerAttached = 'true';
    }
  });
} 