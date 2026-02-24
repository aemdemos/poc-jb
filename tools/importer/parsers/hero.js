/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero block
 *
 * Source: https://www.nationwide.co.uk
 * Base Block: hero
 *
 * Block Structure (from block library):
 * - Row 1: Block name header ("Hero")
 * - Row 2: Background image (optional)
 * - Row 3: Content (heading, subheading, CTAs)
 *
 * Source HTML Pattern (from cleaned.html):
 * div.StyledCompoenents__HeroContainerInner
 *   a.StyledCompoenents__StyledLink (wrapping link)
 *   div.StyledCompoenents__ContentContainer (grid)
 *     div.StyledCompoenents__TextColumn
 *       h2.StyledCompoenents__StyledHeadingUi > span (heading with <em> for emphasis)
 *       div.StyledCompoenents__StyledRichText > p, p (body text)
 *     div.StyledCompoenents__StyledLinkGroup
 *       a.StyledCompoenents__StyledScLink (CTA button)
 *     div.StyledCompoenents__ImageColumn
 *       picture > img.StyledCompoenents__StyledHeroImage
 *   div.StyledCompoenents__StyledLogoGrid
 *     img.StyledCompoenents__StyledImages (logo images)
 *
 * Generated: 2026-02-24
 */
export default function parse(element, { document }) {
  // Extract heading from hero
  // VALIDATED: cleaned.html has h2[class*="StyledCompoenents__StyledHeadingUi"]
  const heading = element.querySelector('h2[class*="StyledHeadingUi"]')
    || element.querySelector('h2[class*="StyledCompoenents"]')
    || element.querySelector('h2')
    || element.querySelector('h1');

  // Extract body text paragraphs
  // VALIDATED: cleaned.html has div[class*="StyledCompoenents__StyledRichText"] > p
  const richTextContainer = element.querySelector('div[class*="StyledRichText"]')
    || element.querySelector('div[class*="RichText"]');
  const bodyParagraphs = richTextContainer
    ? Array.from(richTextContainer.querySelectorAll('p'))
    : Array.from(element.querySelectorAll('p')).slice(0, 3);

  // Extract CTA links
  // VALIDATED: cleaned.html has a[class*="StyledCompoenents__StyledScLink"] within LinkGroup
  const ctaLinks = Array.from(
    element.querySelectorAll('div[class*="LinkGroup"] a[class*="ScLink"], div[class*="LinkGroup"] a[class*="StyledScLink"]'),
  );
  // Fallback: any anchor with role="button" or button-like styling
  const fallbackCtas = ctaLinks.length > 0
    ? ctaLinks
    : Array.from(element.querySelectorAll('a[role="button"], a[class*="Button"]'));

  // Extract hero image
  // VALIDATED: cleaned.html has img[class*="StyledCompoenents__StyledHeroImage"]
  const heroImage = element.querySelector('img[class*="StyledHeroImage"]')
    || element.querySelector('div[class*="ImageColumn"] img')
    || element.querySelector('picture img');

  // Build content cell - heading + body text + CTAs
  const contentCell = document.createElement('div');

  if (heading) {
    const h2 = document.createElement('h2');
    h2.innerHTML = heading.innerHTML;
    contentCell.appendChild(h2);
  }

  bodyParagraphs.forEach((p) => {
    const para = document.createElement('p');
    para.innerHTML = p.innerHTML;
    contentCell.appendChild(para);
  });

  fallbackCtas.forEach((cta) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const link = document.createElement('a');
    link.href = cta.href;
    link.textContent = cta.textContent.trim();
    strong.appendChild(link);
    p.appendChild(strong);
    contentCell.appendChild(p);
  });

  // Build cells array matching hero block structure
  const cells = [];

  // Row 1: Background/hero image (optional)
  if (heroImage) {
    const img = document.createElement('img');
    img.src = heroImage.src;
    img.alt = heroImage.alt || '';
    cells.push([img]);
  }

  // Row 2: Content (heading + body + CTAs)
  cells.push([contentCell]);

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
