// scripts/fullscreen-image.js

export default function initFullscreenImage() {
  // Create modal elements once
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  const modalContent = document.createElement('div');
  modalContent.className = 'image-modal-content';
  const modalImage = document.createElement('img');
  modalContent.appendChild(modalImage);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Handle clicks on images
  document.addEventListener('click', (event) => {
    const clickedImage = event.target.closest('img');
    if (!clickedImage) return;

    // Set the modal image source and show modal
    modalImage.src = clickedImage.src;
    modalImage.alt = clickedImage.alt;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable scrolling
  });

  // Close modal when clicking outside the image
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Handle ESC key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  }
}