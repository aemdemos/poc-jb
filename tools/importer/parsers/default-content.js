/* eslint-disable */
/* global WebImporter */

/**
 * Parser for default content sections (not blocks)
 *
 * Source: https://www.nationwide.co.uk
 * Output: Plain HTML elements (not wrapped in a block table)
 *
 * Handles ContentWithSidebar and similar text-heavy sections that map
 * to EDS default content (headings + paragraphs) rather than blocks.
 * On the homepage, the ISQ intro, FCA text, APP scams, and footnote
 * are all default content sections with Section Metadata applied.
 *
 * Source HTML Pattern:
 *   div.ContentWithSidebar__ContentWithSideBarGrid
 *     div.ContentWithSidebar__ContainerWrapper
 *       h2, div.RichText > p (introductory text content)
 *
 * EDS output: heading + paragraph elements (plain default content),
 * optionally followed by a Section Metadata block for styling.
 *
 * Created: 2026-03-04
 */
export default function parse(element, { document }) {
  // Extract content from ContentWithSidebar pattern
  const wrapper = element.querySelector('div[class*="ContentWithSidebar__ContainerWrapper"]')
    || element.querySelector('div[class*="ContainerWrapper"]')
    || element;

  // Build a document fragment with the extracted content
  const fragment = document.createDocumentFragment();

  // Extract heading
  const heading = wrapper.querySelector('h2') || wrapper.querySelector('h3');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.innerHTML = heading.innerHTML;
    fragment.appendChild(h);
  }

  // Extract body text from RichText containers
  const richTexts = wrapper.querySelectorAll('div[class*="RichText"]');
  const seen = new Set();

  if (richTexts.length > 0) {
    richTexts.forEach((rt) => {
      const paragraphs = Array.from(rt.querySelectorAll('p'));
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text && !seen.has(text)) {
          seen.add(text);
          const para = document.createElement('p');
          para.innerHTML = p.innerHTML;
          fragment.appendChild(para);
        }
      });
    });
  } else {
    // Fallback: extract paragraphs directly
    const paragraphs = Array.from(wrapper.querySelectorAll('p'));
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (text && !seen.has(text)) {
        seen.add(text);
        const para = document.createElement('p');
        para.innerHTML = p.innerHTML;
        fragment.appendChild(para);
      }
    });
  }

  // Extract standalone links not already inside paragraphs
  const links = Array.from(wrapper.querySelectorAll('a[href]'));
  links.forEach((link) => {
    if (!link.closest('p') && !link.closest('h2') && !link.closest('h3')) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim();
      p.appendChild(a);
      fragment.appendChild(p);
    }
  });

  // Replace the original element with the plain content
  // This becomes EDS default content — the migration workflow will
  // wrap it in a section and add Section Metadata as needed
  element.replaceWith(fragment);
}
