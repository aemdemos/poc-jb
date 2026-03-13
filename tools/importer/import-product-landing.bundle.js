var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-product-landing.js
  var import_product_landing_exports = {};
  __export(import_product_landing_exports, {
    default: () => import_product_landing_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document }) {
    const badgeImage = element.querySelector('img[class*="StyledHeroImage"]') || element.querySelector('div[class*="ImageColumn"] img') || element.querySelector("picture img");
    const heading = element.querySelector('h2[class*="StyledHeadingUi"]') || element.querySelector('h2[class*="StyledCompoenents"]') || element.querySelector("h2") || element.querySelector("h1");
    const richTextContainer = element.querySelector('div[class*="StyledRichText"]') || element.querySelector('div[class*="RichText"]');
    const bodyParagraphs = richTextContainer ? Array.from(richTextContainer.querySelectorAll("p")) : Array.from(element.querySelectorAll("p")).slice(0, 3);
    const ctaLinks = Array.from(
      element.querySelectorAll('div[class*="LinkGroup"] a[class*="ScLink"], div[class*="LinkGroup"] a[class*="StyledScLink"]')
    );
    const fallbackCtas = ctaLinks.length > 0 ? ctaLinks : Array.from(element.querySelectorAll('a[role="button"], a[class*="Button"]'));
    const cells = [];
    if (badgeImage) {
      const img = document.createElement("img");
      img.src = badgeImage.src;
      img.alt = badgeImage.alt || "";
      cells.push([img]);
    }
    const contentCell = document.createElement("div");
    if (heading) {
      const h2 = document.createElement("h2");
      h2.innerHTML = heading.innerHTML;
      contentCell.appendChild(h2);
    }
    bodyParagraphs.forEach((p) => {
      const para = document.createElement("p");
      para.innerHTML = p.innerHTML;
      contentCell.appendChild(para);
    });
    fallbackCtas.forEach((cta) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const link = document.createElement("a");
      link.href = cta.href;
      link.textContent = cta.textContent.trim();
      strong.appendChild(link);
      p.appendChild(strong);
      contentCell.appendChild(p);
    });
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse2(element, { document }) {
    const cells = [];
    const isIconCards = element.matches('ol[class*="IconBlock"]') || !!element.querySelector('ol[class*="IconBlock__StyledOl"]');
    const isActionCards = element.matches('div[class*="CardsGrid"]') || !!element.querySelector('div[class*="ActionCard__ActionCardOuter"]');
    if (isIconCards) {
      const iconList = element.matches("ol") ? element : element.querySelector('ol[class*="IconBlock"]');
      const items = iconList ? Array.from(iconList.querySelectorAll('li[class*="IconBlock__StyledLiCol"]')) : [];
      items.forEach((item) => {
        const iconImg = item.querySelector('img[class*="IconBlock__StyledImage"]') || item.querySelector("img");
        const link = item.querySelector('span[class*="IconBlock__ContentContainer"] a') || item.querySelector("a");
        const imgCell = document.createElement("div");
        if (iconImg) {
          const img = document.createElement("img");
          img.src = iconImg.src;
          img.alt = iconImg.alt || (link ? link.textContent.trim() : "");
          imgCell.appendChild(img);
        }
        const textCell = document.createElement("div");
        if (link) {
          const strong = document.createElement("strong");
          strong.textContent = link.textContent.trim();
          const p1 = document.createElement("p");
          p1.appendChild(strong);
          textCell.appendChild(p1);
          const a = document.createElement("a");
          a.href = link.href;
          a.textContent = link.textContent.trim();
          const p2 = document.createElement("p");
          p2.appendChild(a);
          textCell.appendChild(p2);
        }
        cells.push([imgCell, textCell]);
      });
    } else if (isActionCards) {
      const cards = Array.from(
        element.querySelectorAll('div[class*="ActionCard__ActionCardOuter"]')
      );
      cards.forEach((card) => {
        const cardImg = card.querySelector('div[class*="ActionCard__ActionCardImage"] img') || card.querySelector('div[class*="AspectRatioWrapper"] img') || card.querySelector("img");
        const heading = card.querySelector('div[class*="ActionCard__ActionCardContent"] h2') || card.querySelector("h2") || card.querySelector("h3");
        const bodyContainer = card.querySelector('div[class*="ActionCard__ActionCardContent"] div[class*="Content"]') || card.querySelector('div[class*="ActionCard__ActionCardContent"]');
        const bodyParagraphs = bodyContainer ? Array.from(bodyContainer.querySelectorAll("p")) : [];
        const ctaLink = card.querySelector('a[class*="CardCTATextLinks"]') || card.querySelector('div[class*="LinkContainer"] a') || card.querySelector("a[href]");
        const imgCell = document.createElement("div");
        if (cardImg) {
          const img = document.createElement("img");
          img.src = cardImg.src;
          img.alt = cardImg.alt || "";
          imgCell.appendChild(img);
        }
        const textCell = document.createElement("div");
        if (heading) {
          const strong = document.createElement("strong");
          strong.textContent = heading.textContent.trim();
          const p = document.createElement("p");
          p.appendChild(strong);
          textCell.appendChild(p);
        }
        bodyParagraphs.forEach((para) => {
          const p = document.createElement("p");
          p.innerHTML = para.innerHTML;
          textCell.appendChild(p);
        });
        if (ctaLink) {
          const a = document.createElement("a");
          a.href = ctaLink.href;
          a.textContent = ctaLink.textContent.trim();
          const p = document.createElement("p");
          p.appendChild(a);
          textCell.appendChild(p);
        }
        cells.push([imgCell, textCell]);
      });
    } else {
      const items = Array.from(element.children);
      items.forEach((item) => {
        const img = item.querySelector("img");
        const text = item.querySelector("h2, h3, p, a");
        const imgCell = document.createElement("div");
        if (img) {
          const imgEl = document.createElement("img");
          imgEl.src = img.src;
          imgEl.alt = img.alt || "";
          imgCell.appendChild(imgEl);
        }
        const textCell = document.createElement("div");
        if (text) {
          textCell.innerHTML = text.outerHTML;
        }
        cells.push([imgCell, textCell]);
      });
    }
    const blockName = isIconCards ? "Cards (icon-nav)" : "Cards";
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse3(element, { document }) {
    const cells = [];
    const isImageWithContent = !!element.querySelector('div[class*="ImageWithContent__StyledImageArea"]') || element.matches('div[class*="ImageWithContent"]') || element.matches('div[class*="vertical-rhythm--image-with-content"]');
    const isSideBySide = element.matches('div[class*="SideBySideLayout__SideBySideGrid"]') || !!element.querySelector('div[class*="SideBySideLayout__SideBySideGrid"]');
    if (isImageWithContent) {
      const imageArea = element.querySelector('div[class*="ImageWithContent__StyledImageArea"]');
      const contentArea = element.querySelector('div[class*="ImageWithContent__StyledContentArea"]');
      const imgCell = document.createElement("div");
      if (imageArea) {
        const desktopImg = imageArea.querySelector('div[class*="DesktopImage"] img') || imageArea.querySelector("img");
        if (desktopImg) {
          const img = document.createElement("img");
          img.src = desktopImg.src;
          img.alt = desktopImg.alt || "";
          imgCell.appendChild(img);
        }
      }
      const contentCell = document.createElement("div");
      if (contentArea) {
        const heading = contentArea.querySelector("h2") || contentArea.querySelector("h3");
        if (heading) {
          const h = document.createElement(heading.tagName.toLowerCase());
          h.innerHTML = heading.innerHTML;
          contentCell.appendChild(h);
        }
        const richText = contentArea.querySelector('div[class*="RichText"]');
        const paragraphs = richText ? Array.from(richText.querySelectorAll(":scope > p")) : Array.from(contentArea.querySelectorAll("p"));
        paragraphs.forEach((p) => {
          const para = document.createElement("p");
          para.innerHTML = p.innerHTML;
          contentCell.appendChild(para);
        });
        const list = contentArea.querySelector('ul[class*="ListTicksCrosses"], ul[class*="StyledList"]') || contentArea.querySelector("ul");
        if (list) {
          const ul = document.createElement("ul");
          const items = Array.from(list.querySelectorAll("li"));
          items.forEach((li) => {
            const newLi = document.createElement("li");
            const textDiv = li.querySelector("div > p") || li.querySelector("p");
            newLi.textContent = textDiv ? textDiv.textContent.trim() : li.textContent.trim();
            ul.appendChild(newLi);
          });
          contentCell.appendChild(ul);
        }
        const ctaLinks = Array.from(
          contentArea.querySelectorAll('div[class*="LinkGroup"] a')
        );
        if (ctaLinks.length === 0) {
          const fallbackLinks = Array.from(contentArea.querySelectorAll('a[role="button"], a[class*="Button"]'));
          fallbackLinks.forEach((cta) => {
            const p = document.createElement("p");
            const strong = document.createElement("strong");
            const link = document.createElement("a");
            link.href = cta.href;
            link.textContent = cta.textContent.trim();
            strong.appendChild(link);
            p.appendChild(strong);
            contentCell.appendChild(p);
          });
        } else {
          ctaLinks.forEach((cta) => {
            const p = document.createElement("p");
            const strong = document.createElement("strong");
            const link = document.createElement("a");
            link.href = cta.href;
            link.textContent = cta.textContent.trim();
            strong.appendChild(link);
            p.appendChild(strong);
            contentCell.appendChild(p);
          });
        }
      }
      cells.push([imgCell, contentCell]);
    } else if (isSideBySide) {
      const grid = element.matches('div[class*="SideBySideGrid"]') ? element : element.querySelector('div[class*="SideBySideGrid"]');
      const columns = grid ? Array.from(grid.querySelectorAll(':scope > div[class*="NelComponents__Col"], :scope > div[class*="Col"]')) : Array.from(element.children);
      const columnCells = columns.map((col) => {
        const cell = document.createElement("div");
        const wrapper = col.querySelector('div[class*="ContainerWrapper"]') || col;
        const heading = wrapper.querySelector("h2") || wrapper.querySelector("h3");
        if (heading) {
          const h = document.createElement(heading.tagName.toLowerCase());
          h.innerHTML = heading.innerHTML;
          cell.appendChild(h);
        }
        const richTexts = wrapper.querySelectorAll('div[class*="RichText"]');
        richTexts.forEach((rt) => {
          const paragraphs = Array.from(rt.querySelectorAll("p"));
          paragraphs.forEach((p) => {
            const para = document.createElement("p");
            para.innerHTML = p.innerHTML;
            cell.appendChild(para);
          });
        });
        if (richTexts.length === 0) {
          const paragraphs = Array.from(wrapper.querySelectorAll("p"));
          paragraphs.forEach((p) => {
            const para = document.createElement("p");
            para.innerHTML = p.innerHTML;
            cell.appendChild(para);
          });
        }
        const images = Array.from(
          wrapper.querySelectorAll('div[class*="Image__StyledGenericImage"] img, div[class*="DesktopImage"] img')
        );
        images.forEach((img) => {
          const imgEl = document.createElement("img");
          imgEl.src = img.src;
          imgEl.alt = img.alt || "";
          const p = document.createElement("p");
          p.appendChild(imgEl);
          cell.appendChild(p);
        });
        const list = wrapper.querySelector("ul");
        if (list) {
          const ul = document.createElement("ul");
          Array.from(list.querySelectorAll("li")).forEach((li) => {
            const newLi = document.createElement("li");
            const link = li.querySelector("a");
            if (link) {
              const a = document.createElement("a");
              a.href = link.href;
              a.textContent = link.textContent.trim();
              newLi.appendChild(a);
            } else {
              newLi.textContent = li.textContent.trim();
            }
            ul.appendChild(newLi);
          });
          cell.appendChild(ul);
        }
        const ctaLinks = Array.from(wrapper.querySelectorAll('div[class*="LinkGroup"] a'));
        ctaLinks.forEach((cta) => {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          const link = document.createElement("a");
          link.href = cta.href;
          link.textContent = cta.textContent.trim();
          strong.appendChild(link);
          p.appendChild(strong);
          cell.appendChild(p);
        });
        if (ctaLinks.length === 0) {
          const standaloneLinks = Array.from(wrapper.querySelectorAll(":scope > a, div > a[href]"));
          standaloneLinks.forEach((link) => {
            if (!link.closest("ul") && !link.closest("p") && !link.closest("h2") && !link.closest("h3")) {
              const p = document.createElement("p");
              const a = document.createElement("a");
              a.href = link.href;
              a.textContent = link.textContent.trim();
              p.appendChild(a);
              cell.appendChild(p);
            }
          });
        }
        return cell;
      });
      if (columnCells.length > 0) {
        cells.push(columnCells);
      }
    } else {
      const children = Array.from(element.children);
      const columnCells = children.map((child) => {
        const cell = document.createElement("div");
        cell.innerHTML = child.innerHTML;
        return cell;
      });
      if (columnCells.length > 0) {
        cells.push(columnCells);
      }
    }
    let blockName = "Columns";
    if (isSideBySide) {
      const hasSearch = !!element.querySelector('input[type="search"], input[type="text"], [class*="Search"]');
      const hasImages = !!element.querySelector("img");
      const hasHeadings = !!element.querySelector("h2, h3");
      const allLinks = element.querySelectorAll("a[href]");
      const linkCount = allLinks.length;
      let hasColoredBg = false;
      const parentSpacer = element.closest('div[class*="VerticalSpacer"]') || element.parentElement;
      if (parentSpacer && typeof getComputedStyle !== "undefined") {
        try {
          const bg = getComputedStyle(parentSpacer).backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            const rgbMatch = bg.match(/\d+/g);
            if (rgbMatch) {
              const [r, g, b] = rgbMatch.map(Number);
              if (r < 250 || g < 250 || b < 250) {
                hasColoredBg = true;
              }
            }
          }
        } catch (e) {
        }
      }
      if (hasSearch) {
        blockName = "Columns (boxed, search)";
      } else if (hasColoredBg && hasHeadings) {
        blockName = "Columns (boxed)";
      } else if (hasHeadings && !hasImages && linkCount >= 6) {
        blockName = "Columns (boxed, plain)";
      } else if (hasHeadings && !hasImages) {
        blockName = "Columns (text-links)";
      }
    } else if (isImageWithContent) {
    }
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/default-content.js
  function parse4(element, { document }) {
    const wrapper = element.querySelector('div[class*="ContentWithSidebar__ContainerWrapper"]') || element.querySelector('div[class*="ContainerWrapper"]') || element;
    const fragment = document.createDocumentFragment();
    const heading = wrapper.querySelector("h2") || wrapper.querySelector("h3");
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.innerHTML = heading.innerHTML;
      fragment.appendChild(h);
    }
    const richTexts = wrapper.querySelectorAll('div[class*="RichText"]');
    const seen = /* @__PURE__ */ new Set();
    if (richTexts.length > 0) {
      richTexts.forEach((rt) => {
        const paragraphs = Array.from(rt.querySelectorAll("p"));
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (text && !seen.has(text)) {
            seen.add(text);
            const para = document.createElement("p");
            para.innerHTML = p.innerHTML;
            fragment.appendChild(para);
          }
        });
      });
    } else {
      const paragraphs = Array.from(wrapper.querySelectorAll("p"));
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text && !seen.has(text)) {
          seen.add(text);
          const para = document.createElement("p");
          para.innerHTML = p.innerHTML;
          fragment.appendChild(para);
        }
      });
    }
    const links = Array.from(wrapper.querySelectorAll("a[href]"));
    links.forEach((link) => {
      if (!link.closest("p") && !link.closest("h2") && !link.closest("h3")) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.textContent.trim();
        p.appendChild(a);
        fragment.appendChild(p);
      }
    });
    element.replaceWith(fragment);
  }

  // tools/importer/transformers/nationwide-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        ".onetrust-pc-dark-filter"
      ]);
      WebImporter.DOMUtils.remove(element, [
        'header[class*="BaseHeader"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#footer",
        "footer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        'a[class*="SkipLink"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        'nav[aria-label="Navigation menu for selecting site context"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        'nav[aria-label="Breadcrumb"]',
        'nav[class*="Breadcrumb"]',
        'ol[class*="Breadcrumb"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        'div[class*="PromotionalOverlay"]',
        'div[class*="Modal__"]',
        '[role="dialog"]:not(#onetrust-consent-sdk *)'
      ]);
      if (element.style && element.style.overflow === "hidden") {
        element.setAttribute("style", "overflow: scroll;");
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "noscript",
        "link",
        "style",
        "iframe",
        "source"
      ]);
      const allElements = element.querySelectorAll("*");
      allElements.forEach((el) => {
        el.removeAttribute("data-testid");
        el.removeAttribute("data-ref");
        el.removeAttribute("data-nosnippet");
        const attrs = Array.from(el.attributes || []);
        attrs.forEach((attr) => {
          if (attr.name.startsWith("data-styled")) {
            el.removeAttribute(attr.name);
          }
        });
      });
    }
  }

  // tools/importer/import-product-landing.js
  var parsers = {
    "hero": parse,
    "cards": parse2,
    "columns": parse3,
    "default-content": parse4
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "product-landing",
    urlPatterns: [
      "https://www.nationwide.co.uk/current-accounts",
      "https://www.nationwide.co.uk/savings",
      "https://www.nationwide.co.uk/mortgages",
      "https://www.nationwide.co.uk/loans",
      "https://www.nationwide.co.uk/credit-cards",
      "https://www.nationwide.co.uk/insurance"
    ],
    description: "Product landing pages with hero, product cards grid, feature sections, and help/FAQ area. Common pattern: Hero \u2192 promo panel \u2192 product card grid \u2192 feature columns \u2192 more cards \u2192 help section \u2192 footnotes",
    blocks: [
      {
        name: "hero",
        instances: [
          'div[class*="StyledCompoenents__HeroContainerInner"]'
        ]
      },
      {
        name: "cards",
        instances: [
          'div[class*="CardsGrid__StyledCardsGrid"]',
          'ol[class*="IconBlock__StyledOl"]'
        ]
      },
      {
        name: "columns",
        instances: [
          'div[class*="vertical-rhythm--image-with-content"]',
          'div[class*="SideBySideLayout__SideBySideGrid"]'
        ]
      },
      {
        name: "default-content",
        instances: [
          'div[class*="ContentWithSidebar__ContentWithSideBarGrid"]'
        ]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_product_landing_default = {
    transform: ({ document, url, html, params }) => {
      const main = document.body;
      executeTransformers("beforeTransform", main, { document, url, html, params });
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, { document, url, html, params });
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_product_landing_exports);
})();
