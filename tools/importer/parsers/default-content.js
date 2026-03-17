/* eslint-disable */
/* global WebImporter */

/**
 * Parser for default content sections (not blocks)
 *
 * Source: https://www.nationwide.co.uk
 * Output: Plain HTML elements (not wrapped in a block table)
 *
 * Handles ContentWithSidebar, FullWidthLayout, and similar text-heavy
 * sections that map to EDS default content rather than blocks.
 *
 * Walks through ALL content elements recursively, preserving:
 * - Multiple headings (h2, h3, h4)
 * - Paragraphs (with rich HTML including links)
 * - Lists (ul, ol) with rich items (bold + text, links)
 * - Standalone links
 * - HR separators (section breaks)
 *
 * Updated: 2026-03-17
 * - Complete rewrite: walks full DOM tree instead of extracting first heading only
 * - Handles multiple ContentWithSidebar wrappers in same parent
 * - Extracts lists with rich content (bold + descriptive text)
 * - Preserves HR separators as section breaks
 */
export default function parse(element, { document }) {
  const fragment = document.createDocumentFragment();
  const seen = new Set();

  function walkAndExtract(node) {
    if (!node || !node.children) return;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const tag = child.tagName.toLowerCase();
      const cls = (child.className || '').toString();

      // Preserve block tables created by other parsers (e.g., cards inside FullWidthLayout)
      if (tag === 'table' && child.querySelector('th')) {
        fragment.appendChild(child.cloneNode(true));
        continue;
      }

      // Skip elements that other parsers handle (they'll create their own block tables)
      if (cls.includes('CardsGrid') || cls.includes('ActionCard')
        || cls.includes('IconBlock') || cls.includes('SideBySideLayout')
        || cls.includes('ImageWithContent') || cls.includes('HeroContainer')
        || child.closest('table')) {
        continue;
      }

      // Preserve messaging/notice blocks intact for post-processing in import-generic.js
      // These have class "vertical-rhythm--messaging" and contain SVG icon + h3 + p
      if (cls.includes('vertical-rhythm--messaging') || cls.includes('Message-sc')) {
        fragment.appendChild(child.cloneNode(true));
        continue;
      }

      // Handle ButtonGroup/LinkGroup - extract links as prominent CTA-style bold links
      if (cls.includes('ButtonGroup') || cls.includes('LinkGroup')) {
        const links = Array.from(child.querySelectorAll('a[href]'));
        links.forEach((link) => {
          const text = link.textContent.trim();
          if (text && !seen.has('a:' + text)) {
            seen.add('a:' + text);
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = text;
            strong.appendChild(a);
            p.appendChild(strong);
            fragment.appendChild(p);
          }
        });
        continue;
      }

      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
        const text = child.textContent.trim();
        if (text && !seen.has('h:' + text)) {
          seen.add('h:' + text);
          const h = document.createElement(tag);
          h.innerHTML = child.innerHTML;
          fragment.appendChild(h);
        }
      } else if (tag === 'p') {
        const text = child.textContent.trim();
        if (text && !seen.has('p:' + text)) {
          seen.add('p:' + text);
          const para = document.createElement('p');
          para.innerHTML = child.innerHTML;
          fragment.appendChild(para);
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const list = document.createElement(tag);
        const items = Array.from(child.querySelectorAll(':scope > li'));
        items.forEach((li) => {
          const newLi = document.createElement('li');
          const strong = li.querySelector(':scope > strong, :scope > b');
          const innerLink = li.querySelector('a[href]');

          if (strong) {
            const s = document.createElement('strong');
            s.textContent = strong.textContent.trim();
            newLi.appendChild(s);
            const fullText = li.textContent.trim();
            const boldText = strong.textContent.trim();
            const idx = fullText.indexOf(boldText);
            const remaining = idx >= 0
              ? fullText.substring(idx + boldText.length).trim()
              : '';
            if (remaining) {
              newLi.appendChild(document.createTextNode(' ' + remaining));
            }
          } else if (innerLink) {
            const a = document.createElement('a');
            a.href = innerLink.href;
            a.textContent = innerLink.textContent.trim();
            newLi.appendChild(a);
          } else {
            newLi.innerHTML = li.innerHTML;
          }

          if (newLi.textContent.trim()) {
            list.appendChild(newLi);
          }
        });
        if (list.children.length > 0) {
          fragment.appendChild(list);
        }
      } else if (tag === 'hr') {
        fragment.appendChild(document.createElement('hr'));
      } else if (tag === 'a' && child.href) {
        if (!child.closest('p') && !child.closest('li')
          && !child.closest('h2') && !child.closest('h3')) {
          const text = child.textContent.trim();
          if (text && !seen.has('a:' + text)) {
            seen.add('a:' + text);
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = child.href;
            a.textContent = text;
            p.appendChild(a);
            fragment.appendChild(p);
          }
        }
      } else {
        walkAndExtract(child);
      }
    }
  }

  walkAndExtract(element);

  if (fragment.childNodes.length > 0) {
    element.replaceWith(fragment);
  }
}
