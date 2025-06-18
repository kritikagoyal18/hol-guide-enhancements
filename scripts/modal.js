const modalWindow = () => {
    let lastSubmittedData = null; // Store the last submitted data for reuse
  
    // Create floating button
    const floatingBtn = document.createElement('div');
    floatingBtn.className = 'floating-btn';
    floatingBtn.innerText = 'Ask a Question';
    document.body.appendChild(floatingBtn);
  
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    document.body.appendChild(modal);
  
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
  
    const modalQuestion = document.createElement('div');
    modalQuestion.className = 'modal-question';
    modalContent.appendChild(modalQuestion);
  
    modal.appendChild(modalContent);
  
    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';
    modalContent.appendChild(closeBtn);
  
    // Create form
    const form = document.createElement('form');
    form.innerHTML = `
        <label for="email">Your Email (Optional)</label>
        <input type="email" id="email" name="email">
      
        <label for="question">Your Question *</label>
        <textarea id="question" name="question" rows="5" required></textarea>
      
        <button type="submit">Submit</button>
      `;
    modalQuestion.appendChild(form);
  
    // Create thank you message
    const thankYouMessage = document.createElement('div');
    thankYouMessage.id = 'thankYouMessage';
    thankYouMessage.style.display = 'none';
    thankYouMessage.innerHTML = `
        <p>Thank you for your question!</p>
        <!-- <button id="askGenAI">Ask GenAI</button> 
        <p style="font-size:12px">*Response from AI may not be 100% accurate.</p> -->
      `;
  
    // Open modal on floating button click
    floatingBtn.addEventListener('click', () => {
      modal.style.display = 'block';
      modalQuestion.style.width = '100%';
      thankYouMessage.style.display = 'none';
      thankYouMessage.style.width = '0';
      form.style.display = 'block';
    });
  
    // Close modal on close button click
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  
    // Close modal when clicking outside of modal content
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  
    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      // Capture form data
      const email = document.getElementById('email').value;
      const question = document.getElementById('question').value;
      const id = new Date().getTime().toString(); // Generate a unique ID
      // Prepare data as JSON in the required format
      const data = {
        email,
        question,
        id,
      };
  
      try {
        // Send data to the specified API endpoint
        const response = await fetch('https://prod-51.eastus2.logic.azure.com:443/workflows/f944c1190ecc48b8b08031568f5ce6fb/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=JT5qHuhzCNyu0cbC-0IKpyEfuWfOPsvOqQlcHilw37U', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
  
        // Handle response
        if (response.ok) {
          lastSubmittedData = data; // Store the submitted data
          modalQuestion.style.width = '0';
          thankYouMessage.style.width = '100%';
          modalContent.appendChild(thankYouMessage);
          form.style.display = 'none';
          thankYouMessage.style.display = 'block';
          form.reset();
  
          // Get response back from GENAI
  
          // document.getElementById("askGenAI").addEventListener("click", async () => {
          //   console.log("Get GenAI response");
          //   if (lastSubmittedData) {
          //     try {
          //       // Send the same question and id to another endpoint
          //       const response = await fetch('https://prod-02.eastasia.logic.azure.com:443/workflows/f8588a91639a4b68b22073a29fa8258f/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ZiT_AH5bDdeb2qeQYFX29DwSLq2wk1H-fMV_dh0VizM', {
          //         method: 'POST',
          //         headers: {
          //           'Content-Type': 'application/json'
          //         },
          //         body: JSON.stringify({
          //           id: lastSubmittedData.id,
          //           question: lastSubmittedData.question
          //         })
          //       });
  
          //       // Handle response
          //       if (response.ok) {
          //         const responseData = await response.text(); // Assume response is HTML
          //         modalContent.innerHTML = responseData; // Replace modal content with the response
          //       } else {
          //         alert('There was an error with the GenAI request. Please try again.');
          //       }
          //     } catch (error) {
          //       alert('Failed to process the GenAI request. Please check your connection and try
          //        again.');
          //     }
          //   } else {
          //     alert('No previous data found. Please submit a question first.');
          //   }
          // });
        } else {
          alert('There was an error submitting your question. Please try again.');
        }
      } catch (error) {
        alert('Failed to submit your question. Please check your connection and try again.');
      }
    });
  };
  
  export default modalWindow;
  