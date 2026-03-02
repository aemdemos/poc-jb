import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DESKTOP_MQ = window.matchMedia('(min-width: 900px)');
const SITE_DOMAIN = 'nationwide.co.uk';

/**
 * Check if a link is external (different domain).
 * @param {HTMLAnchorElement} link
 * @returns {boolean}
 */
function isExternalLink(link) {
  try {
    const url = new URL(link.href, window.location.origin);
    return !url.hostname.endsWith(SITE_DOMAIN);
  } catch {
    return false;
  }
}

/**
 * Add external link icons to links pointing outside the site domain.
 * Skips app badge links since they already have their own icons.
 * @param {HTMLElement} container
 */
function decorateExternalLinks(container) {
  container.querySelectorAll('a[href]').forEach((link) => {
    if (link.closest('.footer-app-badges') || link.closest('.footer-social') || link.closest('.footer-nav')) return;
    if (isExternalLink(link)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      const img = document.createElement('img');
      img.src = '/icons/external-link.svg';
      img.className = 'footer-external-icon';
      img.alt = '';
      img.loading = 'lazy';
      img.width = 12;
      img.height = 12;
      link.append(img);
    }
  });
}

/**
 * Build the brand section (logo + tagline + app store badges).
 * @param {HTMLElement} section - The first fragment section
 * @returns {HTMLElement}
 */
function buildBrandSection(section) {
  const brand = document.createElement('div');
  brand.className = 'footer-brand';

  // Logo
  const logoWrapper = document.createElement('div');
  logoWrapper.className = 'footer-logo';
  const logoImg = section.querySelector('img');
  if (logoImg) {
    logoImg.loading = 'lazy';
    logoWrapper.append(logoImg);
  }
  brand.append(logoWrapper);

  // Tagline — find the paragraph containing "A good way"
  const paragraphs = section.querySelectorAll('p');
  paragraphs.forEach((p) => {
    const text = p.textContent.trim();
    if (text.includes('A good way') && text.includes('to bank')) {
      const tagline = document.createElement('p');
      tagline.className = 'footer-tagline';
      tagline.innerHTML = p.innerHTML;
      brand.append(tagline);
    }
  });

  // App store badges — find picture/img links
  const appLinks = section.querySelectorAll('a[href*="apple.com"], a[href*="play.google"]');
  if (appLinks.length) {
    const badges = document.createElement('div');
    badges.className = 'footer-app-badges';
    appLinks.forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      badges.append(link);
    });
    brand.append(badges);
  }

  return brand;
}

/**
 * Build the nav columns section with accordion support.
 * @param {HTMLElement} section - The nav fragment section
 * @returns {HTMLElement}
 */
function buildNavSection(section) {
  const nav = document.createElement('nav');
  nav.className = 'footer-nav';
  nav.setAttribute('aria-label', 'Footer navigation');

  const headings = section.querySelectorAll('h2');
  headings.forEach((h2) => {
    const column = document.createElement('div');
    column.className = 'footer-nav-column';

    // Collect the UL that follows the heading
    const ul = h2.nextElementSibling?.tagName === 'UL' ? h2.nextElementSibling : null;
    const id = h2.textContent.trim().toLowerCase().replace(/\s+/g, '-');

    // Desktop heading (visible on desktop only)
    const desktopHeading = document.createElement('h2');
    desktopHeading.className = 'footer-nav-heading';
    desktopHeading.textContent = h2.textContent.trim();

    // Accordion button (visible on mobile/tablet only)
    const button = document.createElement('button');
    button.className = 'footer-nav-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `footer-panel-${id}`);
    button.innerHTML = `<svg class="footer-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg><span>${h2.textContent.trim()}</span>`;

    // Content panel
    const panel = document.createElement('div');
    panel.className = 'footer-nav-panel';
    panel.id = `footer-panel-${id}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', `footer-btn-${id}`);
    button.id = `footer-btn-${id}`;

    if (ul) {
      panel.append(ul);
    }

    // Toggle handler
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.classList.toggle('is-open');
    });

    column.append(desktopHeading);
    column.append(button);
    column.append(panel);
    nav.append(column);
  });

  return nav;
}

/**
 * Build the social links section.
 * @param {HTMLElement} section - The social links fragment section
 * @returns {HTMLElement}
 */
function buildSocialSection(section) {
  const social = document.createElement('div');
  social.className = 'footer-social';

  const ul = section.querySelector('ul');
  if (ul) {
    ul.className = 'footer-social-list';
    ul.querySelectorAll('a').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      // Capture label before clearing text
      const label = link.textContent.trim();
      const icon = link.querySelector('.icon');
      if (icon) {
        link.textContent = '';
        link.append(icon);
        if (label) link.setAttribute('aria-label', label);
      }
    });
    social.append(ul);
  }

  return social;
}

/**
 * Build the legal disclaimers section.
 * @param {HTMLElement} section - The legal fragment section
 * @returns {HTMLElement}
 */
function buildLegalSection(section) {
  const legal = document.createElement('div');
  legal.className = 'footer-legal';
  while (section.firstElementChild) {
    legal.append(section.firstElementChild);
  }
  return legal;
}

/**
 * Build the bottom bar (address + copyright).
 * @param {HTMLElement} section - The bottom fragment section
 * @returns {HTMLElement}
 */
function buildBottomSection(section) {
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  while (section.firstElementChild) {
    bottom.append(section.firstElementChild);
  }
  return bottom;
}

/**
 * Reset accordion state when transitioning to desktop.
 * @param {HTMLElement} nav
 */
function resetAccordionOnDesktop(nav) {
  if (DESKTOP_MQ.matches) {
    nav.querySelectorAll('.footer-nav-toggle').forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
    });
    nav.querySelectorAll('.footer-nav-panel').forEach((panel) => {
      panel.classList.remove('is-open');
    });
  }
}

/**
 * Normalize icon class names to lowercase.
 * DA may capitalize icon names (e.g. icon-Facebook instead of icon-facebook).
 * Also handles DA renaming x-twitter to just X.
 * @param {HTMLElement} container
 */
function normalizeIconNames(container) {
  const iconNameMap = { x: 'x-twitter' };
  container.querySelectorAll('span.icon').forEach((span) => {
    const classes = [...span.classList];
    classes.forEach((cls) => {
      if (cls.startsWith('icon-') && cls !== 'icon') {
        const raw = cls.substring(5);
        const lower = raw.toLowerCase();
        const mapped = iconNameMap[lower] || lower;
        if (mapped !== raw) {
          span.classList.remove(cls);
          span.classList.add(`icon-${mapped}`);
        }
      }
    });
  });
}

/**
 * Fix broken images whose src was set to about:error by DA processing.
 * Maps images by alt text to known fallback paths in the repo.
 * @param {HTMLElement} container
 */
function fixBrokenImages(container) {
  const fallbacks = {
    nationwide: '/images/nbs-logo.svg',
    'link to apple store to download app': '/images/appstore.svg',
    'link to google play to download app': '/images/googleplay.svg',
  };
  container.querySelectorAll('img').forEach((img) => {
    if (!img.src || img.src === 'about:error' || img.src.endsWith('/about:error')) {
      const alt = (img.alt || '').toLowerCase();
      const fallback = fallbacks[alt];
      if (fallback) img.src = fallback;
    }
  });
}

/**
 * Loads and decorates the footer.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // Fix DA content processing artifacts
  normalizeIconNames(fragment);
  fixBrokenImages(fragment);

  block.textContent = '';
  const footerWrapper = document.createElement('div');
  footerWrapper.className = 'footer-wrapper';

  // loadFragment already processes the HTML through decorateSections,
  // which wraps each top-level div as a .section with .default-content-wrapper.
  // Use the section divs directly instead of re-splitting by HR tags.
  const sections = [...fragment.querySelectorAll(':scope > div')];

  // Build each zone from sections
  // Section 0: Brand (logo + tagline + app badges)
  if (sections[0]) {
    footerWrapper.append(buildBrandSection(sections[0]));
  }

  // Section 1: Navigation columns
  if (sections[1]) {
    const nav = buildNavSection(sections[1]);
    footerWrapper.append(nav);
    DESKTOP_MQ.addEventListener('change', () => resetAccordionOnDesktop(nav));
  }

  // Section 2: Social links
  if (sections[2]) {
    footerWrapper.append(buildSocialSection(sections[2]));
  }

  // Section 3: Legal text
  if (sections[3]) {
    footerWrapper.append(buildLegalSection(sections[3]));
  }

  // Section 4: Bottom bar
  if (sections[4]) {
    footerWrapper.append(buildBottomSection(sections[4]));
  }

  // Wrap bottom bar text content for desktop grid layout
  const bottomDiv = footerWrapper.querySelector('.footer-bottom');
  if (bottomDiv) {
    const bottomText = document.createElement('div');
    bottomText.className = 'footer-bottom-text';
    while (bottomDiv.firstChild) {
      bottomText.append(bottomDiv.firstChild);
    }
    bottomDiv.append(bottomText);
  }

  // Move social icons: inside bottom bar on desktop, between nav and legal on mobile
  const socialDiv = footerWrapper.querySelector('.footer-social');
  const legalDiv = footerWrapper.querySelector('.footer-legal');
  function placeSocial() {
    if (!socialDiv || !bottomDiv) return;
    if (DESKTOP_MQ.matches) {
      bottomDiv.append(socialDiv);
    } else if (legalDiv) {
      footerWrapper.insertBefore(socialDiv, legalDiv);
    }
  }
  placeSocial();
  DESKTOP_MQ.addEventListener('change', placeSocial);

  // Decorate external links (skips app badges and social links)
  decorateExternalLinks(footerWrapper);

  block.append(footerWrapper);
}
