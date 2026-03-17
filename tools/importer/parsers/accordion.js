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
  element.replaceWith(block);
}
