import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && (div.querySelector('picture') || div.querySelector(':scope > img'))) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  /* icon-nav: wrap each card image in the same link as the card body */
  if (block.classList.contains('icon-nav')) {
    ul.querySelectorAll(':scope > li').forEach((li) => {
      const imgDiv = li.querySelector('.cards-card-image');
      const link = li.querySelector('.cards-card-body a');
      if (imgDiv && link) {
        const wrapper = document.createElement('a');
        wrapper.href = link.href;
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.tabIndex = -1;
        wrapper.className = 'cards-card-image-link';
        while (imgDiv.firstChild) wrapper.append(imgDiv.firstChild);
        imgDiv.append(wrapper);
      }
    });
  }

  block.textContent = '';
  block.append(ul);
}
