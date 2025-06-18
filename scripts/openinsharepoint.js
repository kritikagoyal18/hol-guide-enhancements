let counter = 0;
function openInSharepoint() {
  console.log("openInSharepoint called");
  const activeElement = document.querySelector(".active");
  if (activeElement) {
    const hrefValue = activeElement.getAttribute("href");
    const fstab = window.config.fstab;

    if (fstab && hrefValue) {
      const hrefParts = hrefValue.split("/").filter(part => part !== "");
      const parentParts = hrefParts.slice(0, hrefParts.length - 1);
      const parentPath = "/" + parentParts.join("/");
      const redirectionUrl = fstab + parentPath + "?web=1";
      window.open(redirectionUrl, "_blank");
    } else {
      console.error("fstab or hrefValue is missing.");
    }
  } else {
    console.error("No active element found.");
  }
}

export default function openInSharepointEvent() {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.dispatchEvent(new Event('sidekick-ready'));
    }, 3000);
  });

  document.addEventListener('sidekick-ready', () => {
    const sidekick = document.querySelector('aem-sidekick');
    if (sidekick) {
      sidekick.addEventListener('custom:openInSharepoint', () => {
        if (counter == 0 ){
          openInSharepoint();
        }
        counter++;
        if (counter == 5) {
          counter = 0;
        }
      });
    }
  });
}