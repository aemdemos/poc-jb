/* global WebImporter */

// Embedded page templates configuration — synced from page-templates.json
const PAGE_TEMPLATES = {
  templates: [
    {
      name: 'homepage',
      urls: ['https://www.nationwide.co.uk'],
      description: 'Nationwide Building Society homepage with hero banner, product navigation cards, feature cards, call checker, internet banking, service quality rankings, and APP scams data',
      blocks: [
        {
          name: 'hero',
          instances: [
            'div[class*="StyledCompoenents__HeroContainerInner"]',
          ],
        },
        {
          name: 'cards',
          instances: [
            'ol[class*="IconBlock__StyledOl"]',
            'div[class*="CardsGrid__StyledCardsGrid"]',
          ],
        },
        {
          name: 'columns',
          instances: [
            'div[class*="ImageWithContent__StyledContentArea"]',
            'div[class*="SideBySideLayout__SideBySideGrid"]',
          ],
        },
        {
          name: 'default-content',
          instances: [
            'div[class*="ContentWithSidebar__ContentWithSideBarGrid"]',
          ],
          section: 'isq',
        },
      ],
    },
    {
      name: 'product-landing',
      urlPatterns: [
        'https://www.nationwide.co.uk/current-accounts',
        'https://www.nationwide.co.uk/savings',
        'https://www.nationwide.co.uk/mortgages',
        'https://www.nationwide.co.uk/loans',
        'https://www.nationwide.co.uk/credit-cards',
        'https://www.nationwide.co.uk/insurance',
      ],
      description: 'Product landing pages with hero, product cards grid, feature sections, and help/FAQ area',
      blocks: [
        {
          name: 'hero',
          instances: [
            'div[class*="StyledCompoenents__HeroContainerInner"]',
          ],
        },
        {
          name: 'cards',
          instances: [
            'div[class*="CardsGrid__StyledCardsGrid"]',
            'ol[class*="IconBlock__StyledOl"]',
          ],
        },
        {
          name: 'columns',
          instances: [
            'div[class*="ImageWithContent__StyledContentArea"]',
            'div[class*="SideBySideLayout__SideBySideGrid"]',
          ],
        },
        {
          name: 'default-content',
          instances: [
            'div[class*="ContentWithSidebar__ContentWithSideBarGrid"]',
          ],
        },
      ],
    },
    {
      name: 'generic',
      urlPatterns: ['https://www.nationwide.co.uk/'],
      description: 'Fallback template for any Nationwide page',
      blocks: [
        {
          name: 'hero',
          instances: [
            'div[class*="StyledCompoenents__HeroContainerInner"]',
            'div[class*="HeroContainer"]',
          ],
        },
        {
          name: 'cards',
          instances: [
            'div[class*="CardsGrid__StyledCardsGrid"]',
            'ol[class*="IconBlock__StyledOl"]',
            'div[class*="ActionCard__ActionCardOuter"]',
          ],
        },
        {
          name: 'columns',
          instances: [
            'div[class*="ImageWithContent__StyledContentArea"]',
            'div[class*="SideBySideLayout__SideBySideGrid"]',
          ],
        },
        {
          name: 'default-content',
          instances: [
            'div[class*="ContentWithSidebar__ContentWithSideBarGrid"]',
          ],
        },
      ],
    },
  ],
};

/**
 * Find matching template for the given URL.
 * Tries exact URL match first, then prefix-based urlPatterns,
 * returning the most specific match.
 */
function findTemplateByUrl(url) {
  console.log('[Import] Finding template for URL:', url);
  const normalizedUrl = url.replace(/\/$/, '');

  // Pass 1: Exact URL match (highest priority)
  const exactMatch = PAGE_TEMPLATES.templates.find((template) => {
    if (!template.urls) return false;
    return template.urls.some(
      (templateUrl) => normalizedUrl === templateUrl.replace(/\/$/, ''),
    );
  });

  if (exactMatch) {
    console.log('[Import] Found exact match template:', exactMatch.name);
    return exactMatch;
  }

  // Pass 2: URL pattern (prefix) match — longest prefix wins
  let bestMatch = null;
  let bestLength = 0;

  PAGE_TEMPLATES.templates.forEach((template) => {
    if (template.urlPatterns) {
      template.urlPatterns.forEach((pattern) => {
        const normalizedPattern = pattern.replace(/\/$/, '');
        if (normalizedUrl.startsWith(normalizedPattern) && normalizedPattern.length > bestLength) {
          bestMatch = template;
          bestLength = normalizedPattern.length;
        }
      });
    }
  });

  if (bestMatch) {
    console.log('[Import] Found pattern match template:', bestMatch.name);
    return bestMatch;
  }

  console.warn('[Import] No matching template found for URL:', url);
  return null;
}

/**
 * Extract block name from parser file path
 */
function extractBlockName(parserPath) {
  const filename = parserPath.split('/').pop();
  const blockName = filename.replace('.js', '');
  return blockName;
}

/**
 * Find block configuration for a specific block name
 */
function findBlockConfig(template, blockName) {
  return template.blocks.find((block) => block.name === blockName);
}

/**
 * Main transformation function following Helix Importer pattern
 * This is called by the Helix Importer framework
 */
const importConfig = {
  /**
   * Transform the DOM according to page templates and parsers
   * @param {object} context - Transformation context
   * @param {Document} context.document - The page document
   * @param {string} context.url - The page URL
   * @returns {Element} - The transformed main element
   */
  transformDOM: ({ document, url }) => {
    console.log('[Import] Starting transformation for:', url);

    // Get the main element (or body as fallback)
    const main = document.querySelector('main') || document.body;

    // Find matching template
    const template = findTemplateByUrl(url);
    if (!template) {
      console.warn('[Import] No template found, returning main as-is');
      return main;
    }

    // Check if a parser function was injected
    if (typeof window.BLOCK_PARSER === 'undefined') {
      console.warn('[Import] No block parser injected');
      return main;
    }

    const parserInfo = window.BLOCK_PARSER;
    console.log('[Import] Using parser:', parserInfo.name);

    // Find block configuration for this parser
    const blockConfig = findBlockConfig(template, parserInfo.name);
    if (!blockConfig) {
      console.error('[Import] No block configuration found for:', parserInfo.name);
      console.log('[Import] Available blocks:', template.blocks.map((b) => b.name));
      return main;
    }

    console.log('[Import] Block config:', blockConfig);
    console.log('[Import] Looking for instances:', blockConfig.instances);

    // Find all instances of this block on the page and capture results
    let instancesFound = 0;
    const results = [];

    blockConfig.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      console.log(`[Import] Found ${elements.length} instances of "${selector}"`);

      elements.forEach((element, index) => {
        try {
          console.log(`[Import] Processing instance ${index + 1}...`);

          // Clone the element to capture original HTML
          const originalHTML = element.outerHTML.substring(0, 500); // First 500 chars

          // Execute the parser function
          // Note: The parser typically replaces the element with a table
          // We need to capture what comes after the element in the DOM
          const { nextSibling } = element;
          const parent = element.parentElement;

          parserInfo.parse(element, { document });

          // Find the newly created block (it should be where the element was)
          let createdBlock = null;
          if (nextSibling && nextSibling.previousSibling) {
            createdBlock = nextSibling.previousSibling;
          } else if (parent && parent.lastChild) {
            createdBlock = parent.lastChild;
          }

          // Capture the result
          const result = {
            instance: index + 1,
            selector,
            originalHTMLPreview: originalHTML,
            blockCreated: createdBlock ? createdBlock.outerHTML : null,
            blockType: createdBlock ? createdBlock.tagName : null,
          };

          results.push(result);
          instancesFound += 1;
          console.log(`[Import] ✓ Successfully parsed instance ${index + 1}`);
        } catch (error) {
          console.error(`[Import] Error parsing instance ${index + 1}:`, error);
          results.push({
            instance: index + 1,
            selector,
            error: error.message,
          });
        }
      });
    });

    console.log(`[Import] Transformation complete. Processed ${instancesFound} instances.`);

    // Store results globally for retrieval
    window.PARSER_RESULTS = results;

    // Standard cleanup - remove header, footer, nav
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'nav',
      '.header',
      '.footer',
      '.navigation',
    ]);

    return main;
  },

  /**
   * Generate document path from URL
   */
  generateDocumentPath: ({ url }) => WebImporter.FileUtils.sanitizePath(
    new URL(url).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
  ),
};

// Export for module usage (Helix Importer)
// When running in browser via eval, this will be skipped
if (typeof module !== 'undefined' && module.exports) {
  module.exports = importConfig;
}

// Expose for browser/debugging context
if (typeof window !== 'undefined') {
  window.IMPORT_CONFIG = importConfig;

  // Expose utilities for debugging
  window.PARSER_VALIDATOR = {
    PAGE_TEMPLATES,
    findTemplateByUrl,
    extractBlockName,
    findBlockConfig,

    /**
     * Execute the transformation and return results
     * This is called by parser-validator.js to run the parser and get results
     */
    executeTransformation: (url) => {
      console.log('[Parser Validator] Executing transformation...');

      // Run the transformDOM function
      const main = importConfig.transformDOM({ document, url });

      // Return the results and the main element HTML
      return {
        results: window.PARSER_RESULTS || [],
        mainHTML: main ? main.outerHTML : null,
      };
    },
  };
}

console.log('[Import] Import script loaded');
