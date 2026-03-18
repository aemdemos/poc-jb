/**
 * Local import runner - runs the import script against a page HTML
 * using JSDOM and @adobe/helix-importer
 *
 * Usage: node local-import-runner.mjs <source-html> <url> <output-path>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { JSDOM } from 'jsdom';
import { Blocks, DOMUtils, FileUtils, rules } from '@adobe/helix-importer';

// Load the bundled import script
const bundleCode = readFileSync(new URL('./import-generic.bundle.js', import.meta.url), 'utf-8');

// Create a fake window context and evaluate the bundle
const evalBundle = new Function('window', bundleCode + '; return window.CustomImportScript || CustomImportScript;');
const fakeWindow = {};
const CustomImportScript = evalBundle(fakeWindow);
const importScript = CustomImportScript.default || CustomImportScript;

// Read args
const sourceHtml = process.argv[2] || '/tmp/donor-page-source.html';
const pageUrl = process.argv[3] || 'https://www.nationwide.co.uk/help/third-party-access/manage-the-donors-money-using-the-internet-bank';
const outputDir = process.argv[4] || '/workspace/content';

// Load the HTML
const html = readFileSync(sourceHtml, 'utf-8');

// Create JSDOM
const dom = new JSDOM(html, { url: pageUrl });
const document = dom.window.document;

// Provide WebImporter global
const WebImporter = { Blocks, DOMUtils, FileUtils, rules };
globalThis.WebImporter = WebImporter;

// Also set it on the fake window for the bundle
dom.window.WebImporter = WebImporter;

/**
 * Convert a block table to EDS block div format.
 * <table><tr><th>Block Name</th></tr><tr><td>...</td></tr></table>
 * becomes:
 * <div class="block-name"><div><div>...</div></div></div>
 */
function tableToBlockDiv(table, doc) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return null;

  // First row is the block name header
  const th = rows[0].querySelector('th');
  if (!th) return null;

  const blockName = th.textContent.trim();
  // Convert to kebab-case class name: "Cards (icon-nav)" → "cards"
  // Strip parenthetical variants for the class name
  const className = blockName.replace(/\s*\(.*?\)\s*/g, '').toLowerCase().replace(/\s+/g, '-');

  const blockDiv = doc.createElement('div');
  blockDiv.className = className;

  // Convert remaining rows to div rows
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td'));
    const rowDiv = doc.createElement('div');
    cells.forEach((td) => {
      const cellDiv = doc.createElement('div');
      cellDiv.innerHTML = td.innerHTML;
      rowDiv.appendChild(cellDiv);
    });
    blockDiv.appendChild(rowDiv);
  }

  return blockDiv;
}

/**
 * Clean the raw import output to match the cloud import format.
 * - Strips source-site wrapper divs
 * - Converts block tables to EDS block divs
 * - Preserves semantic content (headings, paragraphs, lists, etc.)
 */
function cleanOutput(element, doc) {
  const clean = doc.createDocumentFragment();
  const SEMANTIC_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','ul','ol','hr','img','a','blockquote']);

  function walk(node) {
    if (!node || !node.childNodes) return;
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) continue; // skip text nodes at wrapper level
      if (child.nodeType !== 1) continue;
      const tag = child.tagName.toLowerCase();

      // Convert block tables to EDS block divs
      if (tag === 'table' && child.querySelector('th')) {
        const blockDiv = tableToBlockDiv(child, doc);
        if (blockDiv) {
          clean.appendChild(blockDiv);
        }
        continue;
      }

      // Preserve semantic elements
      if (SEMANTIC_TAGS.has(tag)) {
        const text = child.textContent.trim();
        if (text || tag === 'hr' || tag === 'img') {
          clean.appendChild(child.cloneNode(true));
        }
        continue;
      }

      // Recurse into wrapper divs
      walk(child);
    }
  }

  walk(element);

  // Serialize
  const wrapper = doc.createElement('div');
  wrapper.appendChild(clean);
  return wrapper.innerHTML;
}

// Run the transform
try {
  const results = importScript.transform({
    document,
    url: pageUrl,
    html,
    params: { originalURL: pageUrl },
  });

  if (results && results.length > 0) {
    results.forEach((result, i) => {
      const { element, path } = result;
      const outputHtml = cleanOutput(element, document);

      // Write .plain.html
      const plainPath = `${outputDir}${path}.plain.html`;
      mkdirSync(dirname(plainPath), { recursive: true });
      writeFileSync(plainPath, `<div>${outputHtml}</div>`);
      console.log(`Written: ${plainPath} (${outputHtml.length} bytes)`);

      // Report
      console.log('Report:', JSON.stringify(result.report, null, 2));
    });
  } else {
    console.error('No results returned from transform');
  }
} catch (e) {
  console.error('Transform failed:', e);
}
