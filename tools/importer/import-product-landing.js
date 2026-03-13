/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';
import defaultContentParser from './parsers/default-content.js';

// TRANSFORMER IMPORTS
import nationwideCleanupTransformer from './transformers/nationwide-cleanup.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'hero': heroParser,
  'cards': cardsParser,
  'columns': columnsParser,
  'default-content': defaultContentParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  nationwideCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'product-landing',
  urlPatterns: [
    'https://www.nationwide.co.uk/current-accounts',
    'https://www.nationwide.co.uk/savings',
    'https://www.nationwide.co.uk/mortgages',
    'https://www.nationwide.co.uk/loans',
    'https://www.nationwide.co.uk/credit-cards',
    'https://www.nationwide.co.uk/insurance',
  ],
  description: 'Product landing pages with hero, product cards grid, feature sections, and help/FAQ area. Common pattern: Hero → promo panel → product card grid → feature columns → more cards → help section → footnotes',
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
        'div[class*="vertical-rhythm--image-with-content"]',
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
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: ({ document, url, html, params }) => {
    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, { document, url, html, params });

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, { document, url, html, params });

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
