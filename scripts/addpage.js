function createModal() {
    if (document.getElementById("modal")) {
      return;
    }
  
    const overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.backdropFilter = "blur(5px)";
    
    const modal = document.createElement("div");
    modal.id = "modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.width = "330px";
    modal.style.padding = "20px";
    modal.style.border = "1px solid #ccc";
    modal.style.borderRadius = "5px";
    modal.style.backgroundColor = "#fff";
    modal.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
  
    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.id = "inputField01";
    inputField.placeholder = "Enter the title here...";
    inputField.style.marginBottom = "10px";
    inputField.style.padding = "10px";
    inputField.style.width = "92%";
    inputField.style.border = "1px solid #ccc";
    inputField.style.borderRadius = "5px";
  
    const createPageButton = document.createElement("button");
    createPageButton.id = "createPageButton";
    createPageButton.textContent = "Create Page";
    createPageButton.style.margin = "10px 5px 0 0";
    createPageButton.style.padding = "10px 20px";
    createPageButton.style.backgroundColor = "#007BFF";
    createPageButton.style.color = "#fff";
    createPageButton.style.border = "none";
    createPageButton.style.borderRadius = "5px";
    createPageButton.style.cursor = "pointer";
    createPageButton.onclick = function () { handleButtonClick('page'); };
  
    const closeButton = document.createElement("button");
    closeButton.id = "closeButton";
    closeButton.textContent = "Close";
    closeButton.style.margin = "10px 0 0 0";
    closeButton.style.padding = "10px 20px";
    closeButton.style.backgroundColor = "#ccc";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "5px";
    closeButton.style.cursor = "pointer";
  
    closeButton.onclick = function () {
      document.body.removeChild(modal);
      document.body.removeChild(overlay);
    };
  
    const activeElement = document.querySelector(".active");
    const pElement = activeElement.closest(".nav-heading")?.querySelector("p");
    const parent = pElement ? pElement.textContent.trim() : "TOPICS";
  
    const modalHeading = document.createElement("h4");
    modalHeading.id = "modalHeading";
    
    modalHeading.innerHTML = `Create a page under - <span style="color: #FF0000;">${parent}</span>`;
    
    modal.appendChild(modalHeading);
    modal.appendChild(inputField);
    modal.appendChild(createPageButton);
    modal.appendChild(closeButton);
  
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }
  
  function handleButtonClick(type) {
    const titleInputField = document.getElementById("inputField01");
    const pageTitle = titleInputField.value.trim();
  
    if (!pageTitle) {
      alert("Please enter a page title!");
      return;
    }
  
    let slug = pageTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
  
    const activeElement = document.querySelector(".active");
    if (!activeElement) {
      alert("No active element found!");
      return;
    }
  
    let moduleHref = "/";
  
    const parentUl = activeElement.closest("ul");
    if (parentUl) {
      const parentP = parentUl.previousElementSibling;
      if (parentP && parentP.tagName.toLowerCase() === "p") {
        const liHref = activeElement.getAttribute("href");
        console.log("li href is ", liHref);
        const parentHref = liHref.substring(0, liHref.lastIndexOf("/"));
        console.log("parent href is ", parentHref);
        moduleHref = parentHref || "/";
      }
    }
  
    if (moduleHref === "/") {
      moduleHref = "";
    }
  
    const pageUrl = moduleHref.endsWith("/")
      ? moduleHref + slug
      : moduleHref + "/" + slug;
    console.log("page url is ", pageUrl);
    
    const pElement = activeElement.closest(".nav-heading")?.querySelector("p");
    let parent = pElement ? pElement.textContent.trim() : "TOPICS";
  
    parent = (parent === "TOPICS") ? "" : parent;
  
    const fstab = window.config.fstab;
    console.log("Fstab is ", fstab);
  
    let payload = {
      parent: parent,
      pageTitle: pageTitle,
      folderUrl: moduleHref,
      pageUrl: slug,
      spUrl: fstab
    };
  
    const modal = document.getElementById("modal");
    const createPageButton = document.getElementById("createPageButton");
  
    // Change button text to 'Loading' and add loader
    createPageButton.disabled = true;
    createPageButton.innerHTML = 'Creating the page...<div class="loader"></div>';
  
    // CSS for spinning loader inside button
    const style = document.createElement("style");
    style.innerHTML = `
      .loader {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007BFF;
        border-radius: 50%;
        width: 15px;
        height: 15px;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-left: 10px;
      }
  
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  
    fetch("https://prod-19.eastus2.logic.azure.com:443/workflows/e3d25b1bfd014ebb95384a6ff7447d09/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=pNUpSYI1okMt3sB7xO8TXEQ1hJzbxVJH7eAGpOQqn4M", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      let documentURL = data.documentURL;
      if (documentURL) {
        documentURL = documentURL + '?web=1';
        window.open(documentURL, "_blank");
      } else {
        console.error("Document URL not found in the response.");
      }
    })
    .catch(error => {
      console.error("Error making the AJAX call:", error);
    })
    .finally(() => {
      createPageButton.innerHTML = 'Create Page';
      createPageButton.disabled = false;
      // Close the modal and overlay after the API call is successful
      const modal = document.getElementById("modal");
      const overlay = document.getElementById("overlay");
      if (modal && overlay) {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
      }
    });
  }
  let counter = 0;
  export default function addPageEvent() {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        document.dispatchEvent(new Event('sidekick-ready'));
      }, 3000);
    });
  
    document.addEventListener('sidekick-ready', () => {
      const sidekick = document.querySelector('aem-sidekick');
      if (sidekick) {
        sidekick.addEventListener('custom:addPage', () => {
          if (counter == 0 ){
            createModal();
          }
          counter++;
          if (counter == 5) {
            counter = 0;
          }
        });
      }
    });
  }