/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion block
 *
 * Source: https://www.nationwide.co.uk
 * Base Block: accordion
 *
 * Block Structure (from block library):
 * - Row 1: Block name header ("Accordion")
 * - Row 2+: Each row = one accordion item with [title | content] (2 columns)
 *
 * Source HTML Pattern (from cleaned.html):
 * div[class*="nel-Accordion"]
 *   div[class*="AccordionItem"]
 *     button[class*="AccordionButton"] (title/trigger)
 *     div[class*="AccordionPanel"] (expandable content)
 *       p, ul, ol, a elements (body content)
 *
 * Updated: 2026-03-05
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find accordion items - try multiple selector patterns
  const items = Array.from(
    element.querySelectorAll('[class*="AccordionItem"], [class*="accordion-item"], details'),
  );

  if (items.length === 0) {
    // Fallback: treat direct children as accordion items
    const children = Array.from(element.children);
    children.forEach((child) => {
      const title = child.querySelector('button, summary, h3, h4, [class*="title"], [class*="label"]');
      const panel = child.querySelector('[class*="Panel"], [class*="panel"], [class*="content"], [class*="body"]');

      const titleCell = document.createElement('div');
      if (title) {
        titleCell.textContent = title.textContent.trim();
      }

      const contentCell = document.createElement('div');
      if (panel) {
        contentCell.innerHTML = panel.innerHTML;
      }

      cells.push([titleCell, contentCell]);
    });
  } else {
    items.forEach((item) => {
      // Extract title from button or summary element
      const titleEl = item.querySelector('button[class*="Accordion"], button[class*="accordion"], summary, [class*="AccordionButton"]');

      // Extract content panel
      const panelEl = item.querySelector('[class*="AccordionPanel"], [class*="accordion-panel"], [class*="Panel"]')
        || item.querySelector('div:last-child');

      // Build title cell
      const titleCell = document.createElement('div');
      if (titleEl) {
        titleCell.textContent = titleEl.textContent.trim();
      }

      // Build content cell - preserve lists and links
      const contentCell = document.createElement('div');
      if (panelEl) {
        // Clone and clean the panel content
        const lists = panelEl.querySelectorAll('ul, ol');
        const paragraphs = panelEl.querySelectorAll('p');
        const links = panelEl.querySelectorAll('a[href]');

        if (lists.length > 0) {
          lists.forEach((list) => {
            const newList = document.createElement(list.tagName.toLowerCase());
            Array.from(list.querySelectorAll('li')).forEach((li) => {
              const newLi = document.createElement('li');
              newLi.innerHTML = li.innerHTML;
              newList.appendChild(newLi);
            });
            contentCell.appendChild(newList);
          });
        }

        paragraphs.forEach((p) => {
          // Skip paragraphs that are inside lists
          if (!p.closest('li')) {
            const newP = document.createElement('p');
            newP.innerHTML = p.innerHTML;
            contentCell.appendChild(newP);
          }
        });

        // If no structured content found, use innerHTML as fallback
        if (contentCell.children.length === 0) {
          contentCell.innerHTML = panelEl.innerHTML;
        }
      }

      cells.push([titleCell, contentCell]);
    });
  }

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
