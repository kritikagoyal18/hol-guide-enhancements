import { getMetadata } from "../../scripts/aem.js";

export default async function decorate(block) {
  [...block.children].forEach((row) => {
    const aTag = document.createElement("a");
    aTag.classList.add("button");
    aTag.setAttribute("href", "#");
    // Handle scenario where no button title is given and a default value is picked
    const textContent = row.textContent.trim()
      ? row.textContent
      : "Next Chapter";
    const aText = document.createTextNode(textContent);
    aTag.append(aText);
    row.replaceWith(aTag);
  });

  const nextButtonDiv = document.querySelector(".next-button");

  const leftNavMeta = getMetadata("left-nav");
  const leftNavPath = leftNavMeta ? new URL(leftNavMeta).pathname : "/left-nav";
  const resp = await fetch(`${leftNavPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const leftNavigationDiv = tempDiv.querySelector(".nav-heading");

    if (nextButtonDiv) {
      const links = tempDiv.querySelectorAll("li a");

      const hrefValues = Array.from(links).map((link) =>
        link.getAttribute("href")
      );

      const currentPagePath = window.location.pathname;
      let nextButtonHref = null;

      for (let i = 0; i < hrefValues.length - 1; i++) {
        const currentHref = hrefValues[i];

        if (currentPagePath === currentHref) {
          const nextHref = hrefValues[i + 1];

          if (nextHref) {
            nextButtonHref = nextHref;
            break;
          }
        }
      }

      if (nextButtonHref) {
        nextButtonDiv.querySelector("a")?.setAttribute("href", nextButtonHref);
      } else {
        nextButtonDiv.remove();
      }
    }
  }
}
