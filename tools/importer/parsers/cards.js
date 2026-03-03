/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block
 *
 * Source: https://www.nationwide.co.uk
 * Base Block: cards
 *
 * Block Structure (from block library):
 * - Row 1: Block name header ("Cards")
 * - Row 2+: Each row = one card with [image | text content] (2 columns)
 *
 * Handles TWO distinct card patterns on Nationwide homepage:
 *
 * Pattern A - Icon Navigation Cards (ol.IconBlock__StyledOl):
 *   li.IconBlock__StyledLiCol (x7)
 *     span.IconBlock__ContentContainer > a (link text)
 *     span.IconBlock__StyledSpan > img.IconBlock__StyledImage (SVG icon)
 *
 * Pattern B - Feature Action Cards (div.CardsGrid__StyledCardsGrid):
 *   div.ActionCard__ActionCardOuter (x2)
 *     div.ActionCard__ActionCardImage > img (background image)
 *     div.ActionCard__ActionCardContent > h2, div.Content (text)
 *     div.CardCTATextLinks__LinkContainer > a (CTA link)
 *
 * Generated: 2026-02-24
 */
export default function parse(element, { document }) {
  const cells = [];

  // Detect which card pattern we're dealing with
  const isIconCards = element.matches('ol[class*="IconBlock"]')
    || !!element.querySelector('ol[class*="IconBlock__StyledOl"]');
  const isActionCards = element.matches('div[class*="CardsGrid"]')
    || !!element.querySelector('div[class*="ActionCard__ActionCardOuter"]');

  if (isIconCards) {
    // Pattern A: Icon Navigation Cards
    // VALIDATED: ol[class*="IconBlock__StyledOl"] > li[class*="IconBlock__StyledLiCol"]
    const iconList = element.matches('ol') ? element : element.querySelector('ol[class*="IconBlock"]');
    const items = iconList
      ? Array.from(iconList.querySelectorAll('li[class*="IconBlock__StyledLiCol"]'))
      : [];

    items.forEach((item) => {
      // Extract icon image
      // VALIDATED: img[class*="IconBlock__StyledImage"] (SVG icons)
      const iconImg = item.querySelector('img[class*="IconBlock__StyledImage"]')
        || item.querySelector('img');

      // Extract link text and URL
      // VALIDATED: span[class*="IconBlock__ContentContainer"] > a
      const link = item.querySelector('span[class*="IconBlock__ContentContainer"] a')
        || item.querySelector('a');

      // Build image cell
      const imgCell = document.createElement('div');
      if (iconImg) {
        const img = document.createElement('img');
        img.src = iconImg.src;
        img.alt = iconImg.alt || (link ? link.textContent.trim() : '');
        imgCell.appendChild(img);
      }

      // Build text cell
      const textCell = document.createElement('div');
      if (link) {
        const strong = document.createElement('strong');
        strong.textContent = link.textContent.trim();
        const p1 = document.createElement('p');
        p1.appendChild(strong);
        textCell.appendChild(p1);

        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.textContent.trim();
        const p2 = document.createElement('p');
        p2.appendChild(a);
        textCell.appendChild(p2);
      }

      cells.push([imgCell, textCell]);
    });
  } else if (isActionCards) {
    // Pattern B: Feature Action Cards
    // VALIDATED: div[class*="ActionCard__ActionCardOuter"]
    const cards = Array.from(
      element.querySelectorAll('div[class*="ActionCard__ActionCardOuter"]'),
    );

    cards.forEach((card) => {
      // Extract card image
      // VALIDATED: div[class*="ActionCard__ActionCardImage"] img
      const cardImg = card.querySelector('div[class*="ActionCard__ActionCardImage"] img')
        || card.querySelector('div[class*="AspectRatioWrapper"] img')
        || card.querySelector('img');

      // Extract heading
      // VALIDATED: div[class*="ActionCard__ActionCardContent"] h2
      const heading = card.querySelector('div[class*="ActionCard__ActionCardContent"] h2')
        || card.querySelector('h2')
        || card.querySelector('h3');

      // Extract body text
      // VALIDATED: div[class*="ActionCard__ActionCardContent"] div.Content-sc
      const bodyContainer = card.querySelector('div[class*="ActionCard__ActionCardContent"] div[class*="Content"]')
        || card.querySelector('div[class*="ActionCard__ActionCardContent"]');
      const bodyParagraphs = bodyContainer
        ? Array.from(bodyContainer.querySelectorAll('p'))
        : [];

      // Extract CTA link
      // VALIDATED: a[class*="CardCTATextLinks__InlineScLink"]
      const ctaLink = card.querySelector('a[class*="CardCTATextLinks"]')
        || card.querySelector('div[class*="LinkContainer"] a')
        || card.querySelector('a[href]');

      // Build image cell
      const imgCell = document.createElement('div');
      if (cardImg) {
        const img = document.createElement('img');
        img.src = cardImg.src;
        img.alt = cardImg.alt || '';
        imgCell.appendChild(img);
      }

      // Build text cell
      const textCell = document.createElement('div');
      if (heading) {
        const strong = document.createElement('strong');
        strong.textContent = heading.textContent.trim();
        const p = document.createElement('p');
        p.appendChild(strong);
        textCell.appendChild(p);
      }

      bodyParagraphs.forEach((para) => {
        const p = document.createElement('p');
        p.innerHTML = para.innerHTML;
        textCell.appendChild(p);
      });

      if (ctaLink) {
        const a = document.createElement('a');
        a.href = ctaLink.href;
        a.textContent = ctaLink.textContent.trim();
        const p = document.createElement('p');
        p.appendChild(a);
        textCell.appendChild(p);
      }

      cells.push([imgCell, textCell]);
    });
  } else {
    // Fallback: generic card-like items
    const items = Array.from(element.children);
    items.forEach((item) => {
      const img = item.querySelector('img');
      const text = item.querySelector('h2, h3, p, a');

      const imgCell = document.createElement('div');
      if (img) {
        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.alt = img.alt || '';
        imgCell.appendChild(imgEl);
      }

      const textCell = document.createElement('div');
      if (text) {
        textCell.innerHTML = text.outerHTML;
      }

      cells.push([imgCell, textCell]);
    });
  }

  // Determine block name based on pattern
  const blockName = isIconCards ? 'Cards (icon-nav)' : 'Cards';

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
