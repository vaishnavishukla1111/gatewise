document.addEventListener('DOMContentLoaded', () => {
    const askForm = document.getElementById('askForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    
    const responseContainer = document.getElementById('responseContainer');
    const responseText = document.getElementById('responseText');
    const resetBtn = document.getElementById('resetBtn');

    askForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI Loading State
        btnText.style.display = 'none';
        loader.style.display = 'block';
        submitBtn.disabled = true;
        responseContainer.classList.add('hidden');

        // Gather Data
        const formData = {
            gateId: document.getElementById('gateId').value,
            language: document.getElementById('language').value,
            need: document.getElementById('need').value,
            accessibility: document.getElementById('accessibility').checked
        };

        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Show Success Response
            responseText.textContent = data.recommendation;
            
            // Hide form and show response
            askForm.classList.add('hidden');
            responseContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // Reset Loading State
            btnText.style.display = 'block';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    resetBtn.addEventListener('click', () => {
        responseContainer.classList.add('hidden');
        askForm.reset();
        askForm.classList.remove('hidden');
    });
});
