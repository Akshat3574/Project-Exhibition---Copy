let medicines = []; // This will hold the medicine data

// Function to render the medicines table
function renderMedicines() {
    const tableBody = document.getElementById('medicineTable');
    tableBody.innerHTML = ''; // Clear existing rows

    medicines.forEach((med, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${med.name}</td>
            <td>${med.count}</td>
            <td>${new Date(med.expire).toLocaleDateString('en-GB')}</td>
            <td>
                <button onclick="editMedicine(${index})">Edit</button>
                <button onclick="removeMedicine(${index})">Remove</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Function to handle form submission
document.getElementById('medicineForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('medicineName').value;
    const count = document.getElementById('medicineCount').value;
    const expire = document.getElementById('medicineExpire').value;

    // Add or update medicine
    const existingIndex = medicines.findIndex(med => med.name === name);
    if (existingIndex > -1) {
        // Update existing medicine
        medicines[existingIndex].count = count;
        medicines[existingIndex].expire = expire;
    } else {
        // Add new medicine
        medicines.push({ name, count, expire });
    }

    // Clear form fields
    document.getElementById('medicineForm').reset();
    renderMedicines();
});

// Function to edit a medicine
function editMedicine(index) {
    const med = medicines[index];
    const tableBody = document.getElementById('medicineTable');
    const row = tableBody.rows[index];

    // Create a dropdown for editing
    const editDropdown = `
        <td colspan="4">
            <input type="text" id="editMedicineName" value="${med.name}" required>
            <input type="number" id="editMedicineCount" value="${med.count}" required>
            <input type="date" id="editMedicineExpire" value="${med.expire}" required>
            <button onclick="updateMedicine(${index})">Update</button>
            <button onclick="removeMedicine(${index})">Remove</button>
        </td>
    `;

    // Replace the current row with the edit dropdown
    row.innerHTML = editDropdown;
}

// Function to remove a medicine
function removeMedicine(index) {
    const med = medicines[index];

    // Remove from the database
    fetch('http://localhost:5000/api/delete-medicine', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: med.name })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            medicines.splice(index, 1); // Remove from the array
            renderMedicines(); // Re-render the table
        } else {
            alert('Failed to remove medicine: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while removing the medicine');
    });
}

function updateMedicine(index) {
    const name = document.getElementById('editMedicineName').value;
    const count = document.getElementById('editMedicineCount').value;
    const expire = document.getElementById('editMedicineExpire').value;

    // Update the medicines array
    medicines[index] = { name, count, expire };

    // Update the database
    fetch('http://localhost:5000/api/update-medicine', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, count, expire })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Medicine updated successfully');
            renderMedicines(); // Re-render the table
        } else {
            alert('Failed to update medicine: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the medicine');
    });
}

// Initial render
renderMedicines();