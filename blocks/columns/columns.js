export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Search variant: inject a search form into the last column
  if (block.classList.contains('search')) {
    const columns = block.querySelectorAll(':scope > div > div');
    const searchCol = columns[columns.length - 1];
    if (searchCol) {
      const heading = searchCol.querySelector('h2');

      const form = document.createElement('form');
      form.className = 'search-box';
      form.setAttribute('role', 'search');
      form.action = '/search';
      form.method = 'get';

      const label = document.createElement('label');
      label.className = 'search-label';
      label.htmlFor = 'help-search';
      label.textContent = 'Search';

      const input = document.createElement('input');
      input.type = 'search';
      input.id = 'help-search';
      input.name = 'q';
      input.placeholder = 'Search';

      const button = document.createElement('button');
      button.type = 'submit';
      button.setAttribute('aria-label', 'Search');
      button.innerHTML = '<img src="/icons/search.svg" alt="">';

      form.append(label, input, button);

      if (heading) {
        heading.insertAdjacentElement('afterend', form);
      } else {
        searchCol.prepend(form);
      }
    }
  }
}
