const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const port=5000;
const app = express();


// Middleware
app.use(bodyParser.json());  // For parsing JSON data 
app.use(bodyParser.urlencoded({ extended: true }));  
app.use(cors());


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
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.json({ success: false, message: 'Invalid Employee Number or Password' });
        }
    });
});

// Appointment booking route
app.post('/api/book_appointment', (req, res) => {
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

// Server listening on port 5000
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
