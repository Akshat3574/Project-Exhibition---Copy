// Reference the form element
const form = document.getElementById('ambulanceForm');

// Reference the location field
const locationField = document.getElementById('locationField');

// Add event listener to form
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    try {
        // Collect form data
        const formData = {
            date: document.getElementById('appointment-date').value,
            location: document.getElementById('Place').value, // Use correct ID for the select field
            detail: locationField.value, // Use correct ID for the textarea
        };

        // Validate form data
        if (!formData.date || !formData.location || !formData.detail) {
            alert('Please fill in all required fields');
            return;
        }

        // Make the API request
        const response = await fetch('http://localhost:5000/api/book_ambulance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': "Token "+localStorage.getItem("token")
            },
            body: JSON.stringify(formData)
        });

        // Check if the response contains JSON
        const contentType = response.headers.get("content-type");
        console.log(contentType)
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to book ambulance');
            }

            if (data.success) {
                location.href = "/confirmambulancebooking";
                form.reset(); // Reset form after successful booking
            } else {
                throw new Error(data.message || 'Failed to book ambulance');
            }
        } else {
            throw new Error('Unexpected response format. Please try again later.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message || 'An unexpected error occurred'}`);
    }
});
