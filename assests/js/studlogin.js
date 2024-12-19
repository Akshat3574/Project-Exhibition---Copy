// Handle form submission
document.getElementById('studentLoginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Collect form data
    const registrationNo = document.getElementById('name').value; // Assuming 'name' is the ID for the registration number input
    const password = document.getElementById('password').value;

    // Prepare data to be sent to the backend
    const loginData = {
        registrationNo: registrationNo,
        password: password
    };

    // Send the data to the Node.js server
    try {
        console.log("Sending request to /api/student_login");

        const response = await fetch('http://localhost:5000/api/student_login.html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        const data = await response.json();
        const errorMessageDiv = document.getElementById('error-message');
        console.log(data)
        if (data.success) {
            // Store registration number and JWT token in localStorage
            localStorage.setItem('reg_no', registrationNo); // Store registration number
            localStorage.setItem('token', data.token); // Store JWT token

            // Redirect to the homepage or any other page
            window.location.href = './homepage.html';

            alert("Login successful");
        } else {
            // If login fails, show an error message
            errorMessageDiv.textContent = 'Invalid Registration Number or Password';
            errorMessageDiv.style.color = 'red';
        }
    } catch (error) {
        // Handle any error from the request
        console.error('Error connecting to the server:', error);
        document.getElementById('error-message').textContent = 'Error connecting to the server';
        document.getElementById('error-message').style.color = 'red';
    }
});
