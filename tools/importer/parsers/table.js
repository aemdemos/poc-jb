/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table block
 *
 * Source: https://www.nationwide.co.uk
 * Base Block: table (striped)
 *
 * Block Structure (from block library):
 * - Row 1: Block name header ("Table (striped)")
 * - Row 2: Column headers
 * - Row 3+: Data rows
 *
 * Handles TWO distinct table patterns on Nationwide product pages:
 *
 * Pattern A - Simple Rate Tables (table[class*="SimpleTable"]):
 *   table > thead > tr > th (column headers)
 *   table > tbody > tr > td (data cells)
 *
 * Pattern B - Comparison Tables (div[class*="CurrentAccountsTable"]):
 *   Complex product comparison with card images, bullet lists in cells,
 *   and CTA buttons per product column.
 *
 * Updated: 2026-03-05
 */
export default function parse(element, { document }) {
  const cells = [];

  // Detect which table pattern
  const isHtmlTable = element.matches('table') || !!element.querySelector('table');
  const isComparisonTable = !!element.querySelector('[class*="CurrentAccountsTable"]')
    || !!element.querySelector('[class*="ComparisonTable"]');

  if (isHtmlTable) {
    // Pattern A: Standard HTML table
    const table = element.matches('table') ? element : element.querySelector('table');
    if (!table) return;

    // Extract headers
    const headerRow = table.querySelector('thead tr') || table.querySelector('tr:first-child');
    if (headerRow) {
      const headers = Array.from(headerRow.querySelectorAll('th, td'));
      const headerCells = headers.map((th) => {
        const cell = document.createElement('div');
        cell.textContent = th.textContent.trim();
        return cell;
      });
      cells.push(headerCells);
    }

    // Extract data rows
    const tbody = table.querySelector('tbody') || table;
    const dataRows = Array.from(tbody.querySelectorAll('tr'));
    // Skip the header row if it was in tbody
    const startIndex = !table.querySelector('thead') ? 1 : 0;

    dataRows.slice(startIndex).forEach((row) => {
      const tds = Array.from(row.querySelectorAll('td'));
      const rowCells = tds.map((td) => {
        const cell = document.createElement('div');
        // Preserve bold text and links
        cell.innerHTML = td.innerHTML;
        return cell;
      });
      if (rowCells.length > 0) {
        cells.push(rowCells);
      }
    });
  } else if (isComparisonTable) {
    // Pattern B: Comparison table
    const container = element.querySelector('[class*="CurrentAccountsTable"]')
      || element.querySelector('[class*="ComparisonTable"]')
      || element;

    // Extract product columns
    const productHeaders = Array.from(
      container.querySelectorAll('[class*="ProductHeader"], [class*="ColumnHeader"], th'),
    );
    const productNames = productHeaders.map((h) => h.textContent.trim());

    // Build header row
    const headerCells = [document.createElement('div')]; // Empty first cell for row labels
    productNames.forEach((name) => {
      const cell = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = name;
      cell.appendChild(strong);
      headerCells.push(cell);
    });
    if (headerCells.length > 1) {
      cells.push(headerCells);
    }

    // Extract data rows
    const dataRows = Array.from(
      container.querySelectorAll('[class*="DataRow"], [class*="FeatureRow"], tbody tr'),
    );
    dataRows.forEach((row) => {
      const dataCells = Array.from(row.querySelectorAll('td, [class*="Cell"]'));
      const rowCells = dataCells.map((td) => {
        const cell = document.createElement('div');
        cell.innerHTML = td.innerHTML;
        return cell;
      });
      if (rowCells.length > 0) {
        cells.push(rowCells);
      }
    });
  }

  // Default to striped variant for Nationwide tables
  const blockName = 'Table (striped)';

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
