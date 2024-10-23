const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');  // For session management
const port = 5000;
const app = express();

// Middleware
app.use(bodyParser.json());  // For parsing JSON data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(session({
    secret: 'your_secret_key',  // Use a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }   // Set secure to true if using HTTPS
}));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Akshat',
    database: 'test1',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        next(); // Proceed if authenticated
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized: Please log in' });
    }
}

// Student login route
app.post('/api/student_login', (req, res) => {
    const { registrationNo, password } = req.body;

    const query = 'SELECT * FROM stud_cred WHERE RegNo = ? AND Passwd = ?';
    db.query(query, [registrationNo, password], (err, results) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Database query error', error: err.message });
            return;
        }

        if (results.length > 0) {
            req.session.userId = results[0].RegNo;  // Save the user ID in the session
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.json({ success: false, message: 'Invalid Registration Number or Password' });
        }
    });
});

// Doctor login route
app.post('/api/doctor_login', (req, res) => {
    const { empNo, password } = req.body;

    const query = 'SELECT * FROM doc_cred WHERE EmpID = ? AND Passwd = ?';
    db.query(query, [empNo, password], (err, results) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Database query error', error: err.message });
            return;
        }

        if (results.length > 0) {
            req.session.userId = results[0].EmpID;  // Save the user ID in the session
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.json({ success: false, message: 'Invalid Employee Number or Password' });
        }
    });
});

// Appointment booking route (accessible only to authenticated users)
app.post('/api/book_appointment', isAuthenticated, (req, res) => {
    const { name, age, phone, email, appointment_date } = req.body;

    const query = 'INSERT INTO appointment (name, age, phone, email, appointment_date) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, age, phone, email, appointment_date], (err, result) => {
        if (err) {
            console.error('Database Error:', err);  // Log the error details
            res.status(500).json({ success: false, message: 'Database error', error: err.message });
            return;
        }

        res.json({ success: true, message: 'Appointment booked successfully' });
    });
});

// Student profile route (protected by authentication)
app.get('/api/student_profile', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    const query = 'SELECT * FROM stud_info WHERE RegNo = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Database query error', error: err.message });
            return;
        }

        if (result.length > 0) {
            res.json({ success: true, profileData: result[0] });
        } else {
            res.json({ success: false, message: 'Profile not found' });
        }
    });
});

// Doctor profile route (protected by authentication)
app.get('/api/doctor_profile', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    const query = 'SELECT * FROM doc_info WHERE EmpID = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Database query error', error: err.message });
            return;
        }

        if (result.length > 0) {
            res.json({ success: true, profileData: result[0] });
        } else {
            res.json({ success: false, message: 'Profile not found' });
        }
    });
});

// Logout route
app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error logging out', error: err.message });
        } else {
            res.json({ success: true, message: 'Logged out successfully' });
        }
    });
});

// Server listening on port 5000
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
