 // Handle form submission
 document.getElementById('doctorlogin').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Collect form data
    const empNo = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    // Prepare data to be sent to the backend
    const loginData = {
        empNo: empNo,
        password: password
    };

    // Send the data to the Node.js server
    try {
        const response = await fetch('http://localhost:5000/api/doctor_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });
//a
        const data = await response.json();
        const errorMessageDiv = document.getElementById('error-message');

        if (data.success) {
            alert("Login successful!");
        } else {
            errorMessageDiv.textContent = 'Invalid Employee ID or Password';
        }
    } catch (error) {
        errorMessageDiv.textContent = 'Error connecting to the server';
    }
});