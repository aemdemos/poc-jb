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
  const isContactCards = !!element.querySelector('[class*="GenericContactingCard"]');
  const isLinkCards = !!element.querySelector('[class*="LinkCard__Card"]');
  const isActionCards = !isContactCards && !isLinkCards
    && (element.matches('div[class*="CardsGrid"]')
      || !!element.querySelector('div[class*="ActionCard__ActionCardOuter"]'));

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
  } else if (isContactCards) {
    // Pattern C: Contact Cards (phone, branch, etc.)
    // Note: Cards may be <section> or <div> elements, so use attribute selector only
    // Handles: h2/h3/h4 headings, paragraphs, ol/ul lists, and multiple links
    const contactCards = Array.from(
      element.querySelectorAll('[class*="GenericContactingCard__Card"]'),
    );

    contactCards.forEach((card) => {
      const headings = Array.from(card.querySelectorAll('h2, h3, h4'));
      const paragraphs = Array.from(card.querySelectorAll('p'));
      const lists = Array.from(card.querySelectorAll('ol, ul'));
      const links = Array.from(card.querySelectorAll('a[href]'));

      const textCell = document.createElement('div');

      headings.forEach((h) => {
        const text = h.textContent.trim();
        if (text) {
          const heading = document.createElement(h.tagName.toLowerCase());
          heading.textContent = text;
          textCell.appendChild(heading);
        }
      });

      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text) {
          const para = document.createElement('p');
          para.innerHTML = p.innerHTML;
          textCell.appendChild(para);
        }
      });

      lists.forEach((list) => {
        const newList = document.createElement(list.tagName.toLowerCase());
        const items = Array.from(list.querySelectorAll(':scope > li'));
        items.forEach((li) => {
          const newLi = document.createElement('li');
          newLi.innerHTML = li.innerHTML;
          if (newLi.textContent.trim()) {
            newList.appendChild(newLi);
          }
        });
        if (newList.children.length > 0) {
          textCell.appendChild(newList);
        }
      });

      // Extract links that aren't already inside extracted headings, paragraphs, or lists
      const extractedLinks = new Set();
      textCell.querySelectorAll('a[href]').forEach((a) => extractedLinks.add(a.textContent.trim()));

      links.forEach((link) => {
        const text = link.textContent.trim();
        if (text && !extractedLinks.has(text)) {
          extractedLinks.add(text);
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          const a = document.createElement('a');
          a.href = link.href;
          a.textContent = text;
          strong.appendChild(a);
          p.appendChild(strong);
          textCell.appendChild(p);
        }
      });

      if (textCell.childNodes.length > 0) {
        cells.push([textCell]);
      }
    });
  } else if (isLinkCards) {
    // Pattern D: Link Cards (related links sections)
    // Structure: <section class="LinkCard__Card"> with H2 + UL of links
    const linkCards = Array.from(
      element.querySelectorAll('[class*="LinkCard__Card"]'),
    );

    linkCards.forEach((card) => {
      const heading = card.querySelector('h2, h3');
      const links = Array.from(card.querySelectorAll('a[href]'));

      const textCell = document.createElement('div');

      if (heading) {
        const h = document.createElement(heading.tagName.toLowerCase());
        h.textContent = heading.textContent.trim();
        textCell.appendChild(h);
      }

      if (links.length > 0) {
        const ul = document.createElement('ul');
        links.forEach((link) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = link.href;
          a.textContent = link.textContent.trim();
          li.appendChild(a);
          ul.appendChild(li);
        });
        textCell.appendChild(ul);
      }

      cells.push([textCell]);
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
