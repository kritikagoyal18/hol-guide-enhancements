let titleBlockCounter = 0;

export default function decorate(block) {
  // Generate a unique id for this title block
  titleBlockCounter += 1;
  const uniqueId = `title-block-${titleBlockCounter}`;
  block.id = uniqueId;

  if (block.classList.contains('anchor')) {
    // Expecting: first row (ignored), second row (anchor target ID), third row (title text)
    const rows = block.querySelectorAll(':scope > div');
    if (rows.length == 2) {
      const anchorId = rows[0].textContent.trim();
      const titleText = rows[1].textContent.trim();
      block.innerHTML = '';
      const anchor = document.createElement('a');
      anchor.href = `#${anchorId}`;
      anchor.textContent = titleText;
      anchor.className = 'title-anchor-link';
      block.appendChild(anchor);
    }
  }
}
