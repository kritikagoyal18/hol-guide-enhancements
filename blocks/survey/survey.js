export default function decorate(block) {
  // Find the <p> tag containing the URL
  const p = block.querySelector('p');
  if (!p) return;
  const url = p.textContent.trim();
  if (!url) return;

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.width = '100%';
  iframe.height = '600';
  iframe.style.border = 'none';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  // Optionally, add sandbox for security (can be adjusted as needed)
  iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-popups');

  // Clear the block and append the iframe
  block.innerHTML = '';
  block.appendChild(iframe);
} 