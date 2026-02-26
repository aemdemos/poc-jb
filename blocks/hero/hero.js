export default function decorate(block) {
  // Add Switch Guarantee image as last child (after text content)
  // DOM order: badge, text, guarantee — matches mobile stacking
  const guaranteeRow = document.createElement('div');
  const guaranteeCell = document.createElement('div');
  const img = document.createElement('img');
  img.src = '/images/switch-guarantee.png';
  img.alt = 'Current account Switch guarantee logo';
  img.loading = 'lazy';
  guaranteeCell.appendChild(img);
  guaranteeRow.appendChild(guaranteeCell);
  block.appendChild(guaranteeRow);
}
