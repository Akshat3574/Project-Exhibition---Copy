const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const port = 5000;
const JWT_SECRET = "your_jwt_secret_key"; // Replace with a secure key
require('dotenv').config()
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));
// Database connection setup
const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
  port: "10444",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database");
});

app.get('./index.html', (req, res) => {
  res.send('Welcome to the VITB Medical Portal');
});
// Helper function to verify JWT
function authenticateToken(req, res, next) {
  console.log(req.headers);
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token." });
    req.user = user;
    next();
  });
}
// Student Rgistration Route
app.post("/api/student_register", (req, res) => {
  const {
    registrationNo,
    name,
    password,
    hostel,
    contact,
    gender,
    roomNo,
    medicalCondition,
    bloodGroup,
  } = req.body;
  console.log(
    registrationNo,
    name,
    password,
    hostel,
    contact,
    gender,
    roomNo,
    medicalCondition,
    bloodGroup
  );
  // Validate input
  if (
    !registrationNo ||
    !name ||
    !gender ||
    !contact ||
    !hostel ||
    !roomNo ||
    !password
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // Insert into stud_info table
  const query =
    "INSERT INTO stud_info (RegNo, Name, gender,BloodGroup, Hostel, RoomNo, MedicalCondition) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [
      registrationNo,
      name,
      password,
      hostel,
      roomNo,
      medicalCondition,
      bloodGroup,
    ],
    (err, result) => {
      console.log(bloodGroup, registrationNo, name);
      if (err) {
        console.log(err);
        console.error("Error inserting data:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Database error1",
            error: err.message,
          });
      }
      res.json({ success: true, message: "Registration successful" });
    }
  );
  const query1 = "INSERT INTO stud_cred (RegNo,passwd,Name) VALUES (?,?,?)";
  db.query(query1, [registrationNo, password, name], (err, result) => {
    if (err) {
      console.error("Error creating account", err);
      return res
        .status(500)
        .json({
          success: false,
          message: "Database error2",
          error: err.message,
        });
    }
    res.json({ success: true, message: "Account created successfully" });
  });
});

// Student login route with JWT
app.post("/api/student_login", (req, res) => {
  const { registrationNo, password } = req.body;

  const query = "SELECT * FROM stud_cred WHERE RegNo = ? AND Passwd = ?";
  db.query(query, [registrationNo, password], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      const token = jwt.sign({ registrationNo }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ success: true, message: "Login successful", token });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid Registration Number or Password",
      });
    }
  });
});

// Doctor login route with JWT
app.post("/api/doctor_login", (req, res) => {
  const { empNo, password } = req.body;

  const query = "SELECT * FROM doc_cred WHERE EmpID = ? AND Passwd = ?";
  db.query(query, [empNo, password], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      const token = jwt.sign({ empNo }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ success: true, message: "Login successful", token });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid Employee Number or Password",
      });
    }
  });
});

// Appointment booking route (requires JWT)
app.post("/api/book_appointment", (req, res) => {
  const { name, age, phone, email, appointment_date, symptoms, registerNo } =
    req.body;
  console.log(registerNo);
  if (!name || !age || !phone || !email || !appointment_date || !symptoms) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  const query =
    "INSERT INTO appointment (name, age, phone, email, appointment_date,status, symptoms) VALUES (?, ?, ?, ?, ?,'open',?)";
  db.query(
    query,
    [name, age, phone, email, appointment_date, symptoms],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      res.json({ success: true, message: "Appointment booked successfully" });
    }
  );
});

// Fetch all appointments (requires JWT)
app.get("/api/appointment", (req, res) => {
  const query =
    "SELECT apmtid, name, age, appointment_date, status FROM appointment";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    res.json(results);
  });
});

// Fetch prescriptions data (public endpoint)
app.get("/api/data", (req, res) => {
  const query = "SELECT name, count, expire, last_updated FROM meds";
  db.query(query, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database query error", error: err.message });
    }
    res.json(results);
  });
});

// Ambulance request route (requires JWT)
app.post("/api/book_ambulance", authenticateToken, (req, res) => {
  const { date, location, detail } = req.body;
  const { registrationNo } = req.user; // Extract `RegNo` from decoded token
  console.log(date, location, detail);

  // }

  // Fetch Name and Block from `stud_info` table
  const fetchStudentInfoQuery =
    "SELECT Name, Hostel FROM stud_info WHERE RegNo = ?";
  db.query(fetchStudentInfoQuery, [registrationNo], (err, results) => {
    if (err) {
      console.log(registrationNo);
      return res.status(500).json({
        success: false,
        message: "Database query error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Student information not found" });
    }

    const { Name, Block } = results[0];

    // Insert into `ambulance_requests` table
    const insertRequestQuery = `
            INSERT INTO ambulance_requests (RegNo, Name, Hostel, Date_, location, detail)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    db.query(
      insertRequestQuery,
      [registrationNo, Name, Block, date, location, detail],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }
        res.json({
          success: true,
          message: "Ambulance request submitted successfully",
        });
      }
    );
  });
});

// Doctor profile route (requires JWT)
app.get("/api/doctor_profile", authenticateToken, (req, res) => {
  const { empNo } = req.user; // Extract from decoded token

  const query = "SELECT * FROM doc_info WHERE EmpID = ?";
  db.query(query, [empNo], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      res.json({ success: true, profileData: results[0] });
    } else {
      res.status(404).json({ success: false, message: "Profile not found" });
    }
  });
});

// Fetch medicines for autocomplete
app.get("/api/medicines", (req, res) => {
  const query =
    "SELECT name, count, manufacture, expire, last_updated FROM meds";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query error",
        error: err.message,
      });
    }
    res.json(results);
  });
});

// Update medicine count and appointment status
app.post("/api/update-medicine-and-appointment", (req, res) => {
  const { appointmentId, medicineName, count } = req.body;
  console.log(appointmentId, medicineName, count);

  // Validate input
  if (!appointmentId || !medicineName || !count || count <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid input parameters",
    });
  }

  // Start a transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Transaction error",
        error: err.message,
      });
    }

    // First, update medicine count
    const updateMedicineQuery = `
      UPDATE meds 
      SET count = count - ?, 
          last_updated = CURRENT_TIMESTAMP 
      WHERE name = ? AND count >= ?
    `;

    db.query(
      updateMedicineQuery,
      [count, medicineName, count],
      (err, medicineResult) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({
              success: false,
              message: "Error updating medicine",
              error: err.message,
            });
          });
        }

        // Check if medicine update was successful
        if (medicineResult.affectedRows === 0) {
          return db.rollback(() => {
            res.status(400).json({
              success: false,
              message: "Insufficient medicine quantity",
            });
          });
        }

        // Update appointment status
        const updateAppointmentQuery = `
        UPDATE appointment 
        SET status = 'closed' 
        WHERE apmtid = ?
      `;

        db.query(
          updateAppointmentQuery,
          [appointmentId],
          (err, appointmentResult) => {
            if (err) {
              return db.rollback(() => {
                console.log(err, typeof err);
                res.status(500).json({
                  success: false,
                  message: "Error updating appointment",
                  error: err.message,
                });
              });
            }

            // Commit the transaction
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({
                    success: false,
                    message: "Commit error",
                    error: err.message,
                  });
                });
              }

              res.json({
                success: true,
                message: "Medicine and appointment updated successfully",
              });
            });
          }
        );
      }
    );
  });
});

// Update medicine count and details
app.post("/api/update-medicine", (req, res) => {
  const { name, count, expire } = req.body;

  // Validate input
  if (!name || count === undefined || !expire) {
    return res.status(400).json({
      success: false,
      message: "Invalid input parameters",
    });
  }

  // Update medicine in the database
  const query = `
      UPDATE meds 
      SET count = ?, expire = ?, last_updated = CURRENT_TIMESTAMP 
      WHERE name = ?
  `;

  db.query(query, [count, expire, name], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      message: "Medicine updated successfully",
    });
  });
});

// Delete medicine route
app.delete("/api/delete-medicine", (req, res) => {
  const { name } = req.body;

  const query = "DELETE FROM meds WHERE name = ?";
  db.query(query, [name], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      message: "Medicine deleted successfully",
    });
  });
});

// Server listening on port 5000
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
