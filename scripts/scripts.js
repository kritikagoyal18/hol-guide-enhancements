import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
  decorateBlock,
  loadBlock,
} from './aem.js';
import modalWindow from './modal.js';
import initAnalytics from './analytics.js';
import initConfig from './config.js';
import addPageEvent from './addpage.js';
import openInSharepointEvent from './openinsharepoint.js';
import initFullscreenImage from './fullscreen-image.js';
import { initTheme } from './theme.js';
import downloadPdfEvent from './downloadPdf.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

export function createTag(tag, attributes, html) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement || html instanceof SVGElement) {
      el.append(html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  return el;
}

function prepareLeftNav(main) {
  const aside = createTag('aside');
  main.insertBefore(aside, main.querySelector('.section'));
}

export function setUpLeftNav(main, aside) {
  const leftNav = buildBlock('left-navigation', '');
  aside.append(leftNav);
  main.insertBefore(aside, main.querySelector('.section'));
  decorateBlock(leftNav);
  return loadBlock(leftNav);
}

export function addNextBtn(main) {
  const nextBtn = buildBlock('next-button', '');
  const sectionDiv = main.querySelector('.section');
  sectionDiv.appendChild(nextBtn);
  decorateBlock(nextBtn);
  return loadBlock(nextBtn);
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    // below code is to exclude prepareLeftNav method if page is under tools
    if (!window.location.href.includes('about:srcdoc')) {
      prepareLeftNav(main);
    }
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }

    // below code is to exclude setUpLeftNav method if page is under tools
    console.log(window.location);
    if (!window.location.href.includes('about:srcdoc')) {
      setUpLeftNav(main, main.querySelector('aside'));
      addNextBtn(main);
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/image-modal.css`);
  loadFonts()
  if(!window.location.href.includes('about:srcdoc')) {
    modalWindow();
    initFullscreenImage();
  }
  initAnalytics();
  initConfig();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  initTheme();
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
addPageEvent();
openInSharepointEvent();
downloadPdfEvent();
