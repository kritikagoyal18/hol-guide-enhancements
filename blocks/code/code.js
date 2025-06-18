export default async function decorate(block) {
  // Fetch aside content
  const classList = block.className.split(' ');
  const languageClass = classList.find((cls) => cls.startsWith('language-'));

  if (languageClass) {
    const preElement = block.querySelector('pre');
    const codeElement = block.querySelector('code');

    if (preElement && codeElement) {
      preElement.classList.add(languageClass);
      codeElement.classList.add(languageClass);

      Prism.highlightElement(codeElement);

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-code-button');
      copyButton.textContent = 'Copy';

      // Insert button at the top-right corner
      block.style.position = 'relative';
      block.insertBefore(copyButton, block.firstChild);

      // Copy functionality
      copyButton.addEventListener('click', () => {
        const codeContent = codeElement.innerText; // Extract text from code
        navigator.clipboard.writeText(codeContent)
          .then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = 'Copy';
            }, 3000);
          })
          .catch((err) => console.error('Failed to copy:', err));
      });
    }
  }
}