/**
 * Builds breadcrumb navigation from URL path.
 * Shows only parent path (excludes current page).
 * Skipped on homepage.
 */
function buildBreadcrumbs() {
  const path = window.location.pathname
    .replace(/^\/content/, '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '') || '/';

  if (path === '/') return null;

  const segments = path.split('/').filter(Boolean);
  // Only show parent path — exclude the current (last) segment
  const parentSegments = segments.slice(0, -1);

  const nav = document.createElement('nav');
  nav.className = 'hero-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');

  // Home
  const homeLi = document.createElement('li');
  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.textContent = 'Home';
  homeLi.append(homeLink);
  ol.append(homeLi);

  // Parent path segments (not current page)
  let href = '';
  parentSegments.forEach((segment) => {
    href += `/${segment}`;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = segment.replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    li.append(a);
    ol.append(li);
  });

  nav.append(ol);
  return nav;
}

export default function decorate(block) {
  const rows = [...block.children];

  // Single-row hero with image: split into image row + text row
  // so the grid can place image right, text left (matching 2-row heroes)
  if (rows.length === 1) {
    const cell = rows[0].querySelector(':scope > div');
    if (!cell) return;

    const picture = cell.querySelector(':scope > picture')
      || cell.querySelector(':scope > p > picture');

    if (picture) {
      const wrapper = picture.parentElement;
      const imgRow = document.createElement('div');
      const imgCell = document.createElement('div');
      imgCell.appendChild(picture);
      imgRow.appendChild(imgCell);

      // Remove empty <p> wrapper if picture was its only content
      if (wrapper !== cell && wrapper.children.length === 0) {
        wrapper.remove();
      }

      // Prepend image row: CSS grid puts first-child on right
      block.prepend(imgRow);
    }
  }

  // Insert breadcrumbs above the first heading in the text row
  const breadcrumbs = buildBreadcrumbs();
  if (breadcrumbs) {
    // Find the text row (contains the heading)
    const textRow = [...block.children].find((row) => row.querySelector('h1, h2, h3'));
    if (textRow) {
      const cell = textRow.querySelector(':scope > div') || textRow;
      const heading = cell.querySelector('h1, h2, h3');
      if (heading) {
        heading.before(breadcrumbs);
      }
    }
  }
}
