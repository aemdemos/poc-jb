/* eslint-disable */
/* global WebImporter */

/**
 * Transformer for Nationwide Building Society page cleanup
 * Purpose: Remove non-content elements, cookie banners, navigation overlays,
 *          and fix styled-components HTML quirks before block parsing
 * Applies to: www.nationwide.co.uk (all templates)
 *
 * SELECTORS EXTRACTED FROM:
 * - Captured DOM during migration workflow (cleaned.html)
 * - Playwright inspection of live site
 *
 * Updated: 2026-03-04
 * - Stopped removing footnote text (now kept as footnote section)
 * - Added breadcrumb removal for interior pages
 * - Added promotional overlay/modal removal
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove cookie consent overlay (OneTrust)
    // EXTRACTED: Found <div id="onetrust-consent-sdk"> and .onetrust-pc-dark-filter
    // on live site via Playwright inspection
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.onetrust-pc-dark-filter',
    ]);

    // Remove header/navigation (handled separately, not block content)
    // EXTRACTED: Found <header class="BaseHeader-sc-1tv9xrx-0"> in cleaned.html line 6
    WebImporter.DOMUtils.remove(element, [
      'header[class*="BaseHeader"]',
    ]);

    // Remove footer (handled separately, not block content)
    // EXTRACTED: Found <div id="footer" class="Footer__FooterContainer-sc-cd0zm5-0">
    // in cleaned.html line 921
    WebImporter.DOMUtils.remove(element, [
      '#footer',
      'footer',
    ]);

    // Remove skip-to-content link
    // EXTRACTED: Found <a href="#main" class="SkipLink__StyledLink"> in cleaned.html line 5
    WebImporter.DOMUtils.remove(element, [
      'a[class*="SkipLink"]',
    ]);

    // Remove personal/business context switcher nav
    // EXTRACTED: Found <nav aria-label="Navigation menu for selecting site context">
    // in cleaned.html line 3
    WebImporter.DOMUtils.remove(element, [
      'nav[aria-label="Navigation menu for selecting site context"]',
    ]);

    // Remove breadcrumb navigation (interior pages)
    WebImporter.DOMUtils.remove(element, [
      'nav[aria-label="Breadcrumb"]',
      'nav[class*="Breadcrumb"]',
      'ol[class*="Breadcrumb"]',
    ]);

    // Remove promotional overlays and modals
    WebImporter.DOMUtils.remove(element, [
      'div[class*="PromotionalOverlay"]',
      'div[class*="Modal__"]',
      '[role="dialog"]:not(#onetrust-consent-sdk *)',
    ]);

    // Re-enable scrolling if body has overflow hidden (from cookie modal)
    if (element.style && element.style.overflow === 'hidden') {
      element.setAttribute('style', 'overflow: scroll;');
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove scripts, styles, and other non-content elements
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'link',
      'style',
      'iframe',
      'source',
    ]);

    // Clean up styled-components data attributes that add noise
    const allElements = element.querySelectorAll('*');
    allElements.forEach((el) => {
      // Remove tracking/analytics attributes
      // EXTRACTED: Found data-testid, data-ref attributes throughout cleaned.html
      el.removeAttribute('data-testid');
      el.removeAttribute('data-ref');
      el.removeAttribute('data-nosnippet');
      // Remove styled-components generated class noise (sc-* attributes)
      const attrs = Array.from(el.attributes || []);
      attrs.forEach((attr) => {
        if (attr.name.startsWith('data-styled')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Note: Footnote/disclaimer text is intentionally preserved.
    // It gets placed in its own section with style: footnote during migration.
    // Previously removed "*PayUK quarterly..." text — now kept for authoring.
  }
}
