/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns block
 *
 * Source: https://www.nationwide.co.uk
 * Base Block: columns
 *
 * Block Structure (from block library):
 * - Row 1: Block name header ("Columns" or "Columns (variant)")
 * - Row 2+: Each row has multiple cells (columns), content per cell
 *
 * Handles TWO distinct column patterns on Nationwide pages:
 *
 * Pattern A - ImageWithContent (image + text side-by-side):
 *   div.vertical-rhythm--image-with-content
 *     div.ImageWithContent__StyledImageArea > img
 *     div.ImageWithContent__StyledContentArea > h2, p, ul, a
 *   → Columns (default), or Columns (dark variant when parent has dark bg)
 *
 * Pattern B - SideBySideLayout (two equal text/image columns):
 *   div.SideBySideLayout__SideBySideGrid
 *     div.NelComponents__Col (left) > h2, p, img, a
 *     div.NelComponents__Col (right) > h2, p, img, a
 *   → Columns (text-links) when text-only, Columns (boxed, search) when
 *     containing search/form elements, otherwise Columns
 *
 * Note: ContentWithSidebar pattern is now handled by default-content.js
 * as it maps to EDS default content with section metadata, not a block.
 *
 * Updated: 2026-03-04
 */
export default function parse(element, { document }) {
  const cells = [];

  // Detect which column pattern
  const isImageWithContent = !!element.querySelector('div[class*="ImageWithContent__StyledImageArea"]')
    || element.matches('div[class*="ImageWithContent"]');
  const isSideBySide = element.matches('div[class*="SideBySideLayout__SideBySideGrid"]')
    || !!element.querySelector('div[class*="SideBySideLayout__SideBySideGrid"]');

  if (isImageWithContent) {
    // Pattern A: Image + Content columns
    // VALIDATED: div[class*="ImageWithContent__StyledImageArea"] in cleaned.html
    const imageArea = element.querySelector('div[class*="ImageWithContent__StyledImageArea"]');
    const contentArea = element.querySelector('div[class*="ImageWithContent__StyledContentArea"]');

    // Build image column cell
    const imgCell = document.createElement('div');
    if (imageArea) {
      // VALIDATED: Multiple responsive images (mobile/tablet/desktop)
      // Use desktop image preferentially, fall back to any img
      const desktopImg = imageArea.querySelector('div[class*="DesktopImage"] img')
        || imageArea.querySelector('img');
      if (desktopImg) {
        const img = document.createElement('img');
        img.src = desktopImg.src;
        img.alt = desktopImg.alt || '';
        imgCell.appendChild(img);
      }
    }

    // Build content column cell
    const contentCell = document.createElement('div');
    if (contentArea) {
      // Extract heading
      const heading = contentArea.querySelector('h2') || contentArea.querySelector('h3');
      if (heading) {
        const h = document.createElement(heading.tagName.toLowerCase());
        h.innerHTML = heading.innerHTML;
        contentCell.appendChild(h);
      }

      // Extract body text
      const richText = contentArea.querySelector('div[class*="RichText"]');
      const paragraphs = richText
        ? Array.from(richText.querySelectorAll(':scope > p'))
        : Array.from(contentArea.querySelectorAll('p'));
      paragraphs.forEach((p) => {
        const para = document.createElement('p');
        para.innerHTML = p.innerHTML;
        contentCell.appendChild(para);
      });

      // Extract list items (e.g., Call Checker tick list)
      // VALIDATED: ul[class*="ListTicksCrosses__StyledList"] in cleaned.html
      const list = contentArea.querySelector('ul[class*="ListTicksCrosses"], ul[class*="StyledList"]')
        || contentArea.querySelector('ul');
      if (list) {
        const ul = document.createElement('ul');
        const items = Array.from(list.querySelectorAll('li'));
        items.forEach((li) => {
          const newLi = document.createElement('li');
          // Extract text from li, skipping tick/cross icon images
          const textDiv = li.querySelector('div > p') || li.querySelector('p');
          newLi.textContent = textDiv ? textDiv.textContent.trim() : li.textContent.trim();
          ul.appendChild(newLi);
        });
        contentCell.appendChild(ul);
      }

      // Extract CTA links
      // VALIDATED: div[class*="LinkGroup"] a in cleaned.html
      const ctaLinks = Array.from(
        contentArea.querySelectorAll('div[class*="LinkGroup"] a'),
      );
      if (ctaLinks.length === 0) {
        // Fallback to any anchors with button-like appearance
        const fallbackLinks = Array.from(contentArea.querySelectorAll('a[role="button"], a[class*="Button"]'));
        fallbackLinks.forEach((cta) => {
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          const link = document.createElement('a');
          link.href = cta.href;
          link.textContent = cta.textContent.trim();
          strong.appendChild(link);
          p.appendChild(strong);
          contentCell.appendChild(p);
        });
      } else {
        ctaLinks.forEach((cta) => {
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          const link = document.createElement('a');
          link.href = cta.href;
          link.textContent = cta.textContent.trim();
          strong.appendChild(link);
          p.appendChild(strong);
          contentCell.appendChild(p);
        });
      }
    }

    cells.push([imgCell, contentCell]);
  } else if (isSideBySide) {
    // Pattern B: Side-by-side equal columns
    // VALIDATED: div[class*="SideBySideLayout__SideBySideGrid"] in cleaned.html
    const grid = element.matches('div[class*="SideBySideGrid"]')
      ? element
      : element.querySelector('div[class*="SideBySideGrid"]');

    // VALIDATED: div[class*="NelComponents__Col"] are the column wrappers
    const columns = grid
      ? Array.from(grid.querySelectorAll(':scope > div[class*="NelComponents__Col"], :scope > div[class*="Col"]'))
      : Array.from(element.children);

    const columnCells = columns.map((col) => {
      const cell = document.createElement('div');

      // Get the inner content wrapper
      // VALIDATED: div[class*="SideBySideLayout__ContainerWrapper"] wraps content
      const wrapper = col.querySelector('div[class*="ContainerWrapper"]') || col;

      // Extract heading
      const heading = wrapper.querySelector('h2') || wrapper.querySelector('h3');
      if (heading) {
        const h = document.createElement(heading.tagName.toLowerCase());
        h.innerHTML = heading.innerHTML;
        cell.appendChild(h);
      }

      // Extract body text
      const richTexts = wrapper.querySelectorAll('div[class*="RichText"]');
      richTexts.forEach((rt) => {
        const paragraphs = Array.from(rt.querySelectorAll('p'));
        paragraphs.forEach((p) => {
          const para = document.createElement('p');
          para.innerHTML = p.innerHTML;
          cell.appendChild(para);
        });
      });

      // Extract standalone paragraphs not in RichText
      if (richTexts.length === 0) {
        const paragraphs = Array.from(wrapper.querySelectorAll('p'));
        paragraphs.forEach((p) => {
          const para = document.createElement('p');
          para.innerHTML = p.innerHTML;
          cell.appendChild(para);
        });
      }

      // Extract images (e.g., service quality ranking charts)
      // VALIDATED: div[class*="Image__StyledGenericImage"] > img in cleaned.html
      const images = Array.from(
        wrapper.querySelectorAll('div[class*="Image__StyledGenericImage"] img, div[class*="DesktopImage"] img'),
      );
      images.forEach((img) => {
        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.alt = img.alt || '';
        const p = document.createElement('p');
        p.appendChild(imgEl);
        cell.appendChild(p);
      });

      // Extract list items (e.g., popular searches)
      const list = wrapper.querySelector('ul');
      if (list) {
        const ul = document.createElement('ul');
        Array.from(list.querySelectorAll('li')).forEach((li) => {
          const newLi = document.createElement('li');
          const link = li.querySelector('a');
          if (link) {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.textContent.trim();
            newLi.appendChild(a);
          } else {
            newLi.textContent = li.textContent.trim();
          }
          ul.appendChild(newLi);
        });
        cell.appendChild(ul);
      }

      // Extract CTA links
      const ctaLinks = Array.from(wrapper.querySelectorAll('div[class*="LinkGroup"] a'));
      ctaLinks.forEach((cta) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        const link = document.createElement('a');
        link.href = cta.href;
        link.textContent = cta.textContent.trim();
        strong.appendChild(link);
        p.appendChild(strong);
        cell.appendChild(p);
      });

      // Extract standalone links (not in LinkGroup)
      if (ctaLinks.length === 0) {
        const standaloneLinks = Array.from(wrapper.querySelectorAll(':scope > a, div > a[href]'));
        standaloneLinks.forEach((link) => {
          // Skip links already inside other extracted elements
          if (!link.closest('ul') && !link.closest('p') && !link.closest('h2') && !link.closest('h3')) {
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.textContent.trim();
            p.appendChild(a);
            cell.appendChild(p);
          }
        });
      }

      return cell;
    });

    if (columnCells.length > 0) {
      cells.push(columnCells);
    }
  } else {
    // Fallback: treat direct children as columns
    const children = Array.from(element.children);
    const columnCells = children.map((child) => {
      const cell = document.createElement('div');
      cell.innerHTML = child.innerHTML;
      return cell;
    });
    if (columnCells.length > 0) {
      cells.push(columnCells);
    }
  }

  // Determine variant name based on content analysis
  let blockName = 'Columns';

  if (isSideBySide) {
    // Check if columns contain search/form elements → boxed, search variant
    const hasSearch = !!element.querySelector('input[type="search"], input[type="text"], [class*="Search"]');
    // Check if columns are primarily text+links without images → text-links variant
    const hasImages = !!element.querySelector('img');
    const hasHeadings = !!element.querySelector('h2, h3');

    if (hasSearch) {
      blockName = 'Columns (boxed, search)';
    } else if (hasHeadings && !hasImages) {
      blockName = 'Columns (text-links)';
    }
  } else if (isImageWithContent) {
    // Check if parent section has dark background styling
    const parentSection = element.closest('[class*="VerticalSpacer"]') || element.parentElement;
    const bgColor = parentSection
      ? getComputedStyle(parentSection).backgroundColor
      : '';
    // Dark sections detected by very low RGB values in background
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      const match = bgColor.match(/\d+/g);
      if (match && parseInt(match[0], 10) < 30 && parseInt(match[2], 10) < 80) {
        // Dark background — will need section metadata style: dark
        // Block name stays "Columns" — the dark styling comes from the section
      }
    }
  }

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
