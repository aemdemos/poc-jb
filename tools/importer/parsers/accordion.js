/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion block
 *
 * Source: https://www.nationwide.co.uk
 * Base Block: accordion
 *
 * Block Structure (from block library):
 * - Row N: [label cell, body cell]
 *   label = question heading text
 *   body  = answer content (paragraphs, lists, links)
 *
 * Source HTML Pattern:
 * Nationwide uses h3 > button for expandable sections.
 * The expanded content is the next sibling div (display:none by default).
 *
 * This parser is called on a container element that holds
 * multiple h3>button + hidden-panel pairs (grouped by the import script).
 *
 * Updated: 2026-03-16
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

  // Find all accordion items: h3 or h4 elements containing a button
  const headings = Array.from(element.querySelectorAll('h3, h4')).filter(
    (h) => h.querySelector('button'),
  );

  headings.forEach((heading) => {
    // Label cell: extract the button text (the question)
    const button = heading.querySelector('button');
    const labelCell = document.createElement('div');
    const labelText = button.textContent.trim();
    const p = document.createElement('p');
    p.textContent = labelText;
    labelCell.appendChild(p);

    // Body cell: the next sibling(s) contain the answer content
    // Walk siblings until we hit another heading-with-button or end of container
    const bodyCell = document.createElement('div');
    let nextEl = heading.nextElementSibling;

    while (nextEl) {
      // Stop if we hit another accordion heading
      if ((nextEl.tagName === 'H3' || nextEl.tagName === 'H4') && nextEl.querySelector('button')) {
        break;
      }

      // Extract content from the hidden panel
      const paragraphs = nextEl.querySelectorAll('p');
      const lists = nextEl.querySelectorAll('ul, ol');
      const links = nextEl.querySelectorAll('a[href]');

      if (paragraphs.length > 0) {
        paragraphs.forEach((para) => {
          const newP = document.createElement('p');
          newP.innerHTML = para.innerHTML;
          bodyCell.appendChild(newP);
        });
      } else if (lists.length > 0) {
        lists.forEach((list) => {
          const newList = document.createElement(list.tagName.toLowerCase());
          Array.from(list.querySelectorAll('li')).forEach((li) => {
            const newLi = document.createElement('li');
            newLi.innerHTML = li.innerHTML;
            newList.appendChild(newLi);
          });
          bodyCell.appendChild(newList);
        });
      } else if (nextEl.textContent.trim()) {
        // Fallback: grab text content
        const newP = document.createElement('p');
        newP.textContent = nextEl.textContent.trim();
        bodyCell.appendChild(newP);
      }

      nextEl = nextEl.nextElementSibling;
    }

    // Only add if we have both label and some body content
    if (labelText && bodyCell.childNodes.length > 0) {
      cells.push([labelCell, bodyCell]);
    } else if (labelText) {
      // Even without expanded content, include the item
      const emptyBody = document.createElement('div');
      const placeholder = document.createElement('p');
      placeholder.textContent = '(Content available on source page)';
      emptyBody.appendChild(placeholder);
      cells.push([labelCell, emptyBody]);
    }
  });

  if (cells.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
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
