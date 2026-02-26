/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero block
 *
 * Source: https://www.nationwide.co.uk
 * Base Block: hero
 *
 * Block Structure (EDS block table):
 * - Row 1: Badge/award image (e.g. Which? awards badge)
 * - Row 2: Content (heading with <em> red accent, body text, CTA link)
 *
 * Note: The "Switch Guarantee" logo is NOT part of the authored content.
 * It is injected at runtime by hero.js as the third child div.
 *
 * Source HTML Pattern (from cleaned.html):
 * div.StyledCompoenents__HeroContainerInner
 *   div.StyledCompoenents__ContentContainer (grid)
 *     div.StyledCompoenents__TextColumn
 *       h2.StyledCompoenents__StyledHeadingUi > span (heading with <em> for emphasis)
 *       div.StyledCompoenents__StyledRichText > p (body text paragraphs)
 *     div.StyledCompoenents__StyledLinkGroup
 *       a.StyledCompoenents__StyledScLink (CTA button)
 *     div.StyledCompoenents__ImageColumn
 *       picture > img.StyledCompoenents__StyledHeroImage (badge/award image)
 *
 * CSS layout (hero.css):
 *   Mobile: stacked — badge on top, text center, guarantee below
 *   Tablet (>=600px): grid — badge centered top, text full width, guarantee absolute bottom-right
 *   Desktop (>=900px): 2-col grid — text left (2fr), badge right (1fr), guarantee absolute bottom-right
 *
 * Updated: 2026-02-25
 */
export default function parse(element, { document }) {
  // Extract badge/award image from the hero image column
  // This is the Which? awards badge shown prominently in the hero
  const badgeImage = element.querySelector('img[class*="StyledHeroImage"]')
    || element.querySelector('div[class*="ImageColumn"] img')
    || element.querySelector('picture img');

  // Extract heading — preserve innerHTML to keep <em> tags for red accent styling
  const heading = element.querySelector('h2[class*="StyledHeadingUi"]')
    || element.querySelector('h2[class*="StyledCompoenents"]')
    || element.querySelector('h2')
    || element.querySelector('h1');

  // Extract body text paragraphs from the rich text container
  const richTextContainer = element.querySelector('div[class*="StyledRichText"]')
    || element.querySelector('div[class*="RichText"]');
  const bodyParagraphs = richTextContainer
    ? Array.from(richTextContainer.querySelectorAll('p'))
    : Array.from(element.querySelectorAll('p')).slice(0, 3);

  // Extract CTA links from the link group
  const ctaLinks = Array.from(
    element.querySelectorAll('div[class*="LinkGroup"] a[class*="ScLink"], div[class*="LinkGroup"] a[class*="StyledScLink"]'),
  );
  const fallbackCtas = ctaLinks.length > 0
    ? ctaLinks
    : Array.from(element.querySelectorAll('a[role="button"], a[class*="Button"]'));

  // Build cells array matching hero block structure
  const cells = [];

  // Row 1: Badge/award image
  if (badgeImage) {
    const img = document.createElement('img');
    img.src = badgeImage.src;
    img.alt = badgeImage.alt || '';
    cells.push([img]);
  }

  // Row 2: Content (heading + body text + CTA)
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

  cells.push([contentCell]);

  // Create block table — guarantee image is added by hero.js at runtime
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
