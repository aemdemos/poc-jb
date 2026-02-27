import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// desktop breakpoint media query
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetches an SVG file and returns its markup as a string.
 * @param {string} path The path to the SVG file
 * @returns {Promise<string>} The SVG markup
 */
async function fetchSvg(path) {
  try {
    const resp = await fetch(path);
    if (resp.ok) return resp.text();
  } catch {
    // ignore fetch errors
  }
  return '';
}

/**
 * Collapses all open dropdown sections within the given container.
 * @param {Element} container The container with dropdown items
 * @param {boolean} expanded Whether to expand (true) or collapse (false)
 */
function toggleAllNavSections(container, expanded = false) {
  container.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((item) => {
    item.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Builds the context tabs bar (Personal / Business).
 * @param {Element} section The raw context div from the fragment
 * @returns {Element} The decorated nav-context element
 */
function buildContextTabs(section) {
  section.classList.add('nav-context');
  const links = section.querySelectorAll('a');
  const currentPath = window.location.pathname;

  let hasActive = false;
  links.forEach((link) => {
    link.classList.add('nav-context-tab');
    const linkUrl = new URL(link.href, window.location.origin);
    if (linkUrl.pathname === currentPath || (currentPath === '/' && linkUrl.pathname === '/')) {
      link.classList.add('nav-context-active');
      link.setAttribute('aria-current', 'page');
      hasActive = true;
    }
  });

  // Default first tab as active when no exact match (e.g. local preview paths)
  if (!hasActive && links.length > 0) {
    links[0].classList.add('nav-context-active');
    links[0].setAttribute('aria-current', 'page');
  }

  return section;
}

/**
 * Builds the brand area with inline SVG logos.
 * @param {Element} section The raw brand div from the fragment
 * @returns {Promise<Element>} The decorated nav-brand element
 */
async function buildBrand(section) {
  section.classList.add('nav-brand');

  const [fullLogoSvg, iconSvg] = await Promise.all([
    fetchSvg('/icons/nationwide-logo.svg'),
    fetchSvg('/icons/nationwide-icon.svg'),
  ]);

  const brandLink = section.querySelector('a');
  if (brandLink) {
    brandLink.innerHTML = '';
    brandLink.className = 'nav-brand-link';
    brandLink.setAttribute('aria-label', 'Nationwide home');

    // Full logo for tablet/desktop
    const logoWrapper = document.createElement('span');
    logoWrapper.className = 'nav-brand-logo';
    logoWrapper.innerHTML = fullLogoSvg;
    brandLink.append(logoWrapper);

    // Icon-only for mobile
    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'nav-brand-icon';
    iconWrapper.innerHTML = iconSvg;
    brandLink.append(iconWrapper);
  }

  // Strip leftover button classes from fragment decoration
  section.querySelectorAll('.button-container').forEach((bc) => { bc.className = ''; });
  section.querySelectorAll('.button').forEach((b) => { b.className = 'nav-brand-link'; });

  return section;
}

/**
 * Builds the search bar element.
 * @returns {Promise<Element>} The nav-search element
 */
async function buildSearchBar() {
  const searchSvg = await fetchSvg('/icons/search.svg');

  const searchContainer = document.createElement('div');
  searchContainer.className = 'nav-search';

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.setAttribute('action', '/search');
  form.setAttribute('method', 'get');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'nav-search-input';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search Nationwide');
  input.autocomplete = 'off';

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'nav-search-button';
  button.setAttribute('aria-label', 'Submit search');
  button.innerHTML = searchSvg;

  form.append(input, button);
  searchContainer.append(form);

  return searchContainer;
}

/**
 * Maps tool link text to the icon file name.
 * @param {string} text The link text
 * @returns {string|null} The icon file name without extension
 */
function getToolIconName(text) {
  const mapping = {
    branch: 'branch',
    contact: 'contact',
    help: 'help',
    'log in': 'login',
  };
  return mapping[text.trim().toLowerCase()] || null;
}

/**
 * Builds the utility tools area (Branch, Contact, Help, Log in) with icons.
 * @param {Element} section The raw tools div from the fragment
 * @returns {Promise<Element>} The decorated nav-tools element
 */
async function buildTools(section) {
  section.classList.add('nav-tools');

  const listItems = section.querySelectorAll('li');

  const iconPromises = Array.from(listItems).map(async (li) => {
    const link = li.querySelector('a');
    if (!link) return;

    const text = link.textContent.trim();
    const iconName = getToolIconName(text);

    if (iconName) {
      const svg = await fetchSvg(`/icons/${iconName}.svg`);
      if (svg) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'icon-svg';
        iconSpan.innerHTML = svg;
        link.prepend(iconSpan);
      }
    }

    // Add label span around the text node
    const labelSpan = document.createElement('span');
    labelSpan.className = 'nav-tool-label';
    labelSpan.textContent = text;
    // Remove text nodes, keep icon span
    Array.from(link.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    });
    link.append(labelSpan);

    link.classList.add('nav-tool-link');

    // Mark special items on their <li>
    if (text.toLowerCase() === 'log in') {
      li.classList.add('nav-login');
    }
    if (text.toLowerCase() === 'help') {
      li.classList.add('nav-tools-help');
    }
  });

  await Promise.all(iconPromises);

  // Remove auto-applied button classes from fragment decoration
  section.querySelectorAll('.button-container').forEach((bc) => { bc.className = ''; });
  section.querySelectorAll('.button').forEach((b) => { b.classList.remove('button'); });

  return section;
}

/**
 * Builds the hamburger/menu button for mobile and tablet.
 * @returns {Element} The nav-hamburger wrapper element
 */
function buildMenuButton() {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-hamburger';

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', 'nav');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Open navigation menu');
  button.innerHTML = '<span class="nav-hamburger-icon"></span><span>Menu</span>';

  wrapper.append(button);
  return wrapper;
}

/**
 * Prepares nav-sections for dual use: desktop category bar + mobile flyout.
 * Adds a close button at top and utility links at bottom for mobile.
 * @param {Element} navSections The nav-sections element
 * @param {Element} navTools The nav-tools element
 */
function prepareNavSections(navSections, navTools) {
  // Unwrap <p> tags around top-level category links so li > a selectors work
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li > p').forEach((p) => {
    const a = p.querySelector('a');
    if (a && p.childNodes.length === 1) {
      p.replaceWith(a);
    }
  });

  // Add close button at the top of nav-sections
  const closeContainer = document.createElement('div');
  closeContainer.className = 'nav-sections-close';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close navigation menu');
  closeBtn.innerHTML = '&times;';
  closeContainer.append(closeBtn);
  navSections.prepend(closeContainer);

  // Add cloned utility links at the bottom for mobile flyout
  const utilitiesContainer = document.createElement('div');
  utilitiesContainer.className = 'nav-sections-utilities';
  const toolsClone = navTools.querySelector('ul');
  if (toolsClone) {
    utilitiesContainer.append(toolsClone.cloneNode(true));
  }
  navSections.append(utilitiesContainer);

  // Set up dropdown behavior for category items
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((item) => {
    if (item.querySelector('ul')) {
      item.classList.add('nav-drop');
      item.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Sets up desktop dropdown click/keyboard handlers for nav sections.
 * @param {Element} navSections The nav-sections element
 */
function setupDesktopDropdowns(navSections) {
  let hoverTimeout;

  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li.nav-drop').forEach((item) => {
    item.setAttribute('tabindex', '0');

    item.addEventListener('click', (e) => {
      if (!isDesktop.matches) return;
      const clickedLink = e.target.closest('a');
      if (clickedLink && item.querySelector('ul')?.contains(clickedLink)) return;
      if (clickedLink) e.preventDefault();
      const wasExpanded = item.getAttribute('aria-expanded') === 'true';
      toggleAllNavSections(navSections);
      item.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
    });

    item.addEventListener('keydown', (e) => {
      if (!isDesktop.matches) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        const wasExpanded = item.getAttribute('aria-expanded') === 'true';
        toggleAllNavSections(navSections);
        item.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
      }
    });

    // Open dropdown on hover (desktop only)
    item.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      clearTimeout(hoverTimeout);
      toggleAllNavSections(navSections);
      item.setAttribute('aria-expanded', 'true');
    });

    item.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      hoverTimeout = setTimeout(() => {
        item.setAttribute('aria-expanded', 'false');
      }, 150);
    });

    // Keep dropdown open when hovering over the dropdown panel itself
    const subMenu = item.querySelector('ul');
    if (subMenu) {
      subMenu.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
      });
      subMenu.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
          item.setAttribute('aria-expanded', 'false');
        }, 150);
      });
    }
  });
}

/**
 * Sets up mobile flyout accordion behavior for nav sections.
 * @param {Element} navSections The nav-sections element
 */
function setupFlyoutAccordions(navSections) {
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li.nav-drop').forEach((item) => {
    const topLink = item.querySelector(':scope > a');
    if (topLink) {
      topLink.addEventListener('click', (e) => {
        if (isDesktop.matches) return;
        e.preventDefault();
        const wasExpanded = item.getAttribute('aria-expanded') === 'true';
        // Collapse siblings
        item.parentElement.querySelectorAll(':scope > li').forEach((sibling) => {
          sibling.setAttribute('aria-expanded', 'false');
        });
        item.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
      });
    }
  });
}

/**
 * Loads and decorates the header, mainly the nav.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Load nav fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // Clear the block and build nav structure
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Move fragment children into the nav
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Identify the 4 sections from the nav fragment
  const sections = [...nav.children];
  const [contextSection, brandSection, sectionsSection, toolsSection] = sections;

  // 1. Build context tabs (Personal / Business)
  if (contextSection) buildContextTabs(contextSection);

  // 2. Build brand with inline SVG logos
  if (brandSection) await buildBrand(brandSection);

  // 3. Mark nav-sections and set up dropdowns
  if (sectionsSection) {
    sectionsSection.classList.add('nav-sections');
    // Remove auto-applied button classes from fragment decoration
    sectionsSection.querySelectorAll('.button-container').forEach((bc) => {
      bc.classList.remove('button-container');
    });
    sectionsSection.querySelectorAll('.button').forEach((b) => {
      b.classList.remove('button');
    });
  }

  // 4. Build tools with icons
  if (toolsSection) await buildTools(toolsSection);

  // 5. Build search bar
  const searchBar = await buildSearchBar();

  // 6. Build mobile menu button (wrapped in .nav-hamburger)
  const hamburger = buildMenuButton();
  const menuButton = hamburger.querySelector('button');

  // 7. Prepare nav-sections for dual use (desktop bar + mobile flyout)
  if (sectionsSection && toolsSection) {
    prepareNavSections(sectionsSection, toolsSection);
    setupDesktopDropdowns(sectionsSection);
    setupFlyoutAccordions(sectionsSection);
  }

  // Assemble the nav structure:
  // nav-context → nav-main-bar > inner (brand+search+tools) → nav-sections
  const mainBar = document.createElement('div');
  mainBar.className = 'nav-main-bar';

  const mainBarInner = document.createElement('div');
  mainBarInner.className = 'nav-main-bar-inner';

  if (brandSection) mainBarInner.append(brandSection);
  mainBarInner.append(searchBar);
  if (toolsSection) {
    // Append hamburger inside tools so it participates in the grid "tools" area
    toolsSection.append(hamburger);
    mainBarInner.append(toolsSection);
  }

  mainBar.append(mainBarInner);

  // Rebuild nav children in correct order
  nav.innerHTML = '';
  if (contextSection) nav.append(contextSection);
  nav.append(mainBar);
  if (sectionsSection) nav.append(sectionsSection);

  // Wire up menu button to toggle flyout (nav-sections as flyout on mobile)
  menuButton.addEventListener('click', () => {
    const isOpen = nav.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      nav.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflowY = '';
    } else {
      nav.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-expanded', 'true');
      document.body.style.overflowY = 'hidden';
    }
  });

  // Wire up close button inside nav-sections
  const closeBtn = sectionsSection?.querySelector('.nav-sections-close button');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      nav.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflowY = '';
      menuButton.focus();
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (isDesktop.matches) {
      const expanded = sectionsSection?.querySelector('[aria-expanded="true"]');
      if (expanded) {
        toggleAllNavSections(sectionsSection);
        expanded.focus();
      }
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      nav.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflowY = '';
      menuButton.focus();
    }
  });

  // Close desktop dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && sectionsSection) {
      toggleAllNavSections(sectionsSection, false);
    }
  });

  // Close desktop dropdowns on focus lost
  nav.addEventListener('focusout', (e) => {
    if (!nav.contains(e.relatedTarget) && isDesktop.matches && sectionsSection) {
      toggleAllNavSections(sectionsSection, false);
    }
  });

  // Handle responsive transitions
  const handleResponsive = () => {
    if (isDesktop.matches) {
      // Close mobile flyout when switching to desktop
      nav.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflowY = '';
      if (sectionsSection) toggleAllNavSections(sectionsSection, false);
    } else if (sectionsSection) {
      // Collapse all desktop dropdowns when switching to mobile
      toggleAllNavSections(sectionsSection, false);
    }
  };

  handleResponsive();
  isDesktop.addEventListener('change', handleResponsive);

  // Wrap and append to block
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
