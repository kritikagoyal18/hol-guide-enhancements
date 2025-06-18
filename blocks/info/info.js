export default async function decorate(block) {
    console.log(block);
    
    // Create a new paragraph element
    const noteText = document.createElement('p');
    noteText.innerHTML = '<span class="icon icon-note"><img data-icon-name="note" src="/icons/note.svg" alt="" loading="eager"></span><strong>NOTE</strong>';

    // Find the existing paragraph
    const existingParagraph = block.querySelector('p');

    // Insert the new paragraph before the existing paragraph
    if (existingParagraph) {
        existingParagraph.parentNode.insertBefore(noteText, existingParagraph);
    }
}