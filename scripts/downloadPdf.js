import { downloadPDF } from './pdf-download.js';

let counter = 0;

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
          console.log('downloadPdf');
        }
        counter++;
        if (counter === 5) {
          counter = 0;
        }
      });
    }
  });
}

