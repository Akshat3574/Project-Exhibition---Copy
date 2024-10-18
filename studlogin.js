// Handle form submission
document.getElementById('studentLoginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Collect form data
    const registrationNo = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    // Prepare data to be sent to the backend
    const loginData = {
        registrationNo: registrationNo,
        password: password
    };

    // Send the data to the Node.js server
    try {
        const response = await fetch('http://localhost:5000/api/student_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        const data = await response.json();
        const errorMessageDiv = document.getElementById('error-message');

        if (data.success) {
            window.location.href = 'homepage.html';
            alert("login successful")
            // If login successful, redirect to dashboard
          
        } else {
            // If login fails, show error message
            //alert("incorrect password or username")
            errorMessageDiv.textContent = 'Invalid Registration Number or Password';
        }
    } catch (error) {
        // Handle any error from the request
        document.getElementById('error-message').textContent = 'Error connecting to the server';
    }
});