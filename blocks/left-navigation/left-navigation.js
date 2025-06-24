import { decorateButtons, decorateIcons, getMetadata } from "../../scripts/aem.js";

/**
 * decorates the aside, mainly the left navigation
 * @param {Element} block The aside block element
 */

/**
 * Returns the correct caret icon path based on direction and theme.
 * @param {'down'|'right'} direction
 */
function getCaretIcon(direction) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (direction === 'down') {
    return isDark ? '/icons/icon-caret-down-white.svg' : '/icons/icon-caret-down.svg';
  }
  return isDark ? '/icons/icon-caret-right-white.svg' : '/icons/icon-caret-right.svg';
}

function updateAllCarets() {
  // Update all carets in the left navigation based on the current theme
  document.querySelectorAll('.left-navigation img').forEach(img => {
    if (img.src.includes('caret-down')) {
      img.src = getCaretIcon('down');
    } else if (img.src.includes('caret-right')) {
      img.src = getCaretIcon('right');
    }
  });
}

function loadDropdowns(){
  const paragraphs = document.querySelectorAll('.left-navigation p');
    paragraphs.forEach(paragraph => {
    paragraph.addEventListener('click', function() {
      const dropdown = this.nextElementSibling;
      if (dropdown && dropdown.tagName === 'UL') {
      // Toggle the 'hidden' class to show/hide the dropdown
        if (dropdown.style.display === 'none' || dropdown.style.display === '') {
          dropdown.style.display = 'block';
          paragraph.querySelector('img').src = getCaretIcon('down');
        } else {
          dropdown.style.display = 'none';
          paragraph.querySelector('img').src = getCaretIcon('right');
        }
      }
    });
  });

  const subSection = document.querySelectorAll('.left-navigation h3');
    let hidden = true;
    subSection.forEach(item => {
    const sectionToggleIcon = item.querySelector('img');
    item.addEventListener('click', function() {

      const siblingsParagraphs = Array.from(this.parentNode.querySelectorAll('p')).filter(child => child !== this);
      const siblingsUl = Array.from(this.parentNode.querySelectorAll('ul')).filter(child => child !== this);

      siblingsParagraphs.forEach(sibling => {
        if (sibling.style.display === 'none' || sibling.style.display === '') {
          sibling.style.display = 'block';
          sectionToggleIcon.src = getCaretIcon('down');
          hidden = false;
        } else {
          sibling.style.display = 'none';
          const siblingImage = sibling.querySelector('img');
          if(siblingImage){
            siblingImage.src = getCaretIcon('right');
            sectionToggleIcon.src = getCaretIcon('right');
          }
          hidden = true;
        }
      });

      if(hidden){
        siblingsUl.forEach(sibling => {
          sibling.style.display = 'none';
        });
      }
    });
  });
}

function loadActiveLinks(){
  var path = window.location.pathname;
  // Find the matching link and add the 'active' class
  var links = document.querySelectorAll("a[href='" + path + "']");
  links.forEach(function (link) {
    link.classList.add("active");
  });

  // Find the parent container of the active link and show its dropdown
  let activeContainer = document.querySelector(".active")?.closest("ul");
  let closestNavHeading = document.querySelector(".active")?.closest(".nav-heading");
  let activeSectionHeader = null;
  if (closestNavHeading) {
    activeSectionHeader = closestNavHeading.querySelector("h3");
  }

  if (activeContainer) {
    const activeParagraph = activeContainer.previousElementSibling;
    let dropdownIcon = activeParagraph.querySelector('img');
    if(dropdownIcon){
      dropdownIcon.src = getCaretIcon('down');
    }
    if (activeContainer.tagName === "UL") {
      activeContainer.style.display = "block";
      setTimeout(() => {
        activeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }
  if(activeSectionHeader){
    let siblingsParagraphs = Array.from(activeSectionHeader.parentNode.querySelectorAll('p')).filter(child => child !== activeSectionHeader);
    siblingsParagraphs.forEach(sibling => {
      sibling.style.display = 'block';
    });
    let dropdownIcon = activeSectionHeader.querySelector('img');
    if(dropdownIcon){
      dropdownIcon.src = getCaretIcon('down');
    }
  }
}

// Listen for theme changes and update carets
const observer = new MutationObserver(() => {
  updateAllCarets();
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

export default async function decorate(block) {
  // fetch aside content
  const leftNavMeta = getMetadata('left-nav');
  const leftNavPath = leftNavMeta ? new URL(leftNavMeta).pathname : '/left-nav';
  const resp = await fetch(`${leftNavPath}.plain.html`);
  if (resp.ok) {
      const html = await resp.text();
      block.innerHTML = html;
  }
  decorateIcons(block);
  decorateButtons(block);
  loadDropdowns();
  loadActiveLinks();
  updateAllCarets(); // Ensure correct icons on initial load
  const leftNavigationWrapper = document.querySelector('.left-navigation-wrapper');
}