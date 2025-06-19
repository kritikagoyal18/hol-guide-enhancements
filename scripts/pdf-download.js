export async function downloadPDF() {
  try {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
      <div style="text-align: center;">
        <div style="margin-bottom: 10px;">Generating PDF...</div>
        <div style="font-size: 12px; color: #666;">This may take a few moments</div>
      </div>
    `;
    loadingDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      min-width: 200px;
    `;
    document.body.appendChild(loadingDiv);
    
    // Get current page info
    const currentPage = window.location.pathname;
    
    // Use Vercel function URL
    const apiUrl = `${window.location.origin}/api/generate-pdf`;
    
    console.log('Requesting PDF for:', currentPage);
    console.log('API URL:', apiUrl);
    
    // Send request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPage })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'PDF generation failed');
    }
    
    // Download PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guide.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Remove loading indicator
    document.body.removeChild(loadingDiv);
    
    console.log('PDF downloaded successfully');
    
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to generate PDF: ' + error.message);
    
    // Remove loading indicator
    const loadingDiv = document.querySelector('div[style*="position: fixed"]');
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }
  }
}
