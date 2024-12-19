let dataCache = [];

function handleButtonClick(rowId) {
    const existingDetailsRow = document.querySelector(`#details-row-${rowId}`);
    if (existingDetailsRow) {
        existingDetailsRow.remove();
        return;
    }

    /*let formattedLastUpdated = 'Not Updated';
    if (dataCache[rowId]?.last_updated) {
        const lastUpdated = new Date(dataCache[rowId].last_updated);
        if (!isNaN(lastUpdated.getTime())) {
            formattedLastUpdated = lastUpdated.toLocaleDateString('en-GB');
        }
    }*/

    const additionalInfo = `
        <tr id="details-row-${rowId}">
            <td colspan="4">
                <div class="details-content" style="padding: 10px;">
                    <div style="margin-bottom: 8px;">Additional details for ${dataCache[rowId]?.name || 'N/A'}</div>
                    
                </div>
            </td>
        </tr>
    `;

    const clickedRow = document.querySelector(`#row-${rowId}`);
    if (clickedRow) {
        clickedRow.insertAdjacentHTML('afterend', additionalInfo);
    } else {
        console.error(`Row with ID #row-${rowId} not found`);
    }
}

// Fetch data from the server
function fetchData() {
    fetch('http://localhost:5000/api/appointment')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Unexpected data format');
            }
            console.log('Fetched data:', data); // Log fetched data to verify structure
            dataCache = data;
            buildTable(dataCache);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('myTable').innerHTML =
                '<tr><td colspan="5">Error loading data. Please try again later.</td></tr>';
        });
}


// Build table from data
function buildTable(data) {
    const tableBody = document.getElementById('myTable');
    tableBody.innerHTML = ''; // Clear existing rows

    data.forEach((row, index) => {
        const appointmentDate = new Date(row.appointment_date).toLocaleDateString('en-GB') || 'N/A';

        const tr = document.createElement('tr');
        tr.id = `row-${index}`;
        tr.innerHTML = `
            <td>${row.name || 'N/A'}</td>
            <td>${row.age || 'N/A'}</td>
            <td>${appointmentDate}</td>
            <td>${row.status || 'N/A'}</td>
            <td><button onclick="handleButtonClick(${index})">+</button></td>
        `;
        tableBody.appendChild(tr);
    });
}



// Filter table by search input
function searchTable() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = dataCache.filter(row =>
        row.name?.toLowerCase().includes(searchValue) ||
        row.count?.toString().includes(searchValue) ||
        new Date(row.expire).toLocaleDateString('en-GB').includes(searchValue)
    );
    buildTable(filteredData);
}

// Sort table based on column
function sortTable(column, header) {
    const currentOrder = header.getAttribute('data-order');
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    header.setAttribute('data-order', newOrder);

    const displayName = column.charAt(0).toUpperCase() + column.slice(1);
    header.innerHTML = `${displayName} ${newOrder === 'asc' ? '↑' : '↓'}`;

    dataCache.sort((a, b) => {
        let comparison = 0;

        switch (column) {
            case 'count':
                comparison = (a.count || 0) - (b.count || 0);
                break;
            case 'expire':
                comparison = new Date(a.expire) - new Date(b.expire);
                break;
            case 'status':
                const statusOrder = { open: 1, closed: 2 }; // Define priority
                comparison = (statusOrder[a.status?.toLowerCase()] || 3) -
                             (statusOrder[b.status?.toLowerCase()] || 3);
                break;
            default:
                comparison = String(a[column] || '').localeCompare(String(b[column] || ''));
        }

        return newOrder === 'asc' ? comparison : -comparison;
    });

    buildTable(dataCache);
}


// Initial setup and event listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    document.querySelectorAll('th[data-colname]').forEach(header => {
        const column = header.getAttribute('data-colname');
        header.setAttribute('data-order', 'desc');
        header.addEventListener('click', () => sortTable(column, header));
    });
});

// Extended JavaScript for Appointment Medicine Tracking

// Global variables to store medicine data
let medicineData = [];

// Fetch medicine data from the server
function fetchMedicineData() {
    fetch('http://localhost:5000/api/medicines')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            medicineData = data;
            setupMedicineAutocomplete();
        })
        .catch(error => {
            console.error('Error fetching medicine data:', error);
        });
}

// Setup autocomplete for medicine search
function setupMedicineAutocomplete() {
    const medicineInput = document.getElementById('medicineSearch');

    medicineInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const suggestionsContainer = document.getElementById('medicineSuggestions');
        suggestionsContainer.innerHTML = '';

        if (searchTerm.length > 0) {
            const filteredMedicines = medicineData.filter(med =>
                med.name.toLowerCase().includes(searchTerm)
            );

            filteredMedicines.forEach(med => {
                const div = document.createElement('div');
                div.textContent = `${med.name} (Available: ${med.count})`;
                div.classList.add('suggestion-item');
                div.addEventListener('click', () => {
                    medicineInput.value = med.name;
                    suggestionsContainer.innerHTML = '';
                    updateAvailableCount(med);
                });
                suggestionsContainer.appendChild(div);
            });
        }
    });
}

// Update available count display
function updateAvailableCount(medicine) {
    const availableCountSpan = document.getElementById('availableCount');
    availableCountSpan.textContent = `Available: ${medicine.count}`;
}

// Handle medicine submission
function submitMedicineUsage(rowId) {
    const medicineInput = document.getElementById('medicineSearch');
    const countInput = document.getElementById('medicineCount');

    const medicineName = medicineInput.value;
    const requestedCount = parseInt(countInput.value);

    // Validate inputs
    if (!medicineName || isNaN(requestedCount) || requestedCount <= 0) {
      alert('Please enter valid medicine and count');
      return;
    }

    // Find the specific medicine
    const selectedMedicine = medicineData.find(med => med.name === medicineName);

    if (!selectedMedicine) {
      alert('Medicine not found');
      return;
    }

    // Check if sufficient quantity is available
    if (requestedCount > selectedMedicine.count) {
      alert(`Insufficient quantity. Only ${selectedMedicine.count} available.`);
      return;
    }

    // Prepare data for server update
    const updateData = {
      appointmentId: dataCache[rowId].apmtid,
      medicineName: medicineName,
      count: requestedCount
    };

    // Send update to server
    fetch('http://localhost:5000/api/update-medicine-and-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || 'Server error');
        });
      }
      return response.json();
    })
    .then(result => {  // Add this back
      if (result.success) {
        alert('Medicine usage updated successfully');
        fetchData();
        fetchMedicineData();
      } else {
        throw new Error(result.message || 'Update failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert(error.message || 'An error occurred while updating');
    });
  }

// Modify existing handleButtonClick function
function handleButtonClick(rowId) {
    const existingDetailsRow = document.querySelector(`#details-row-${rowId}`);
    if (existingDetailsRow) {
        existingDetailsRow.remove();
        return;
    }

    let formattedLastUpdated = 'Not Updated';
    if (dataCache[rowId]?.last_updated) {
        const lastUpdated = new Date(dataCache[rowId].last_updated);
        if (!isNaN(lastUpdated.getTime())) {
            formattedLastUpdated = lastUpdated.toLocaleDateString('en-GB');
        }
    }

    const additionalInfo = `
        <tr id="details-row-${rowId}">
            <td colspan="5">
                <div class="details-content" style="padding: 10px;">
                    <div style="margin-bottom: 8px;">Medicine Dispensing for ${dataCache[rowId]?.name || 'N/A'}</div>
                    <div>Last Updated on: ${formattedLastUpdated}</div>
                    <div class="medicine-input-container">
                        <input type="text" id="medicineSearch" placeholder="Search Medicine" autocomplete="off">
                        <div id="medicineSuggestions" class="suggestions-container"></div>
                        <span id="availableCount" style="margin-left: 10px;"></span>
                        <input type="number" id="medicineCount" placeholder="Medicine Count" min="1">
                        <button onclick="submitMedicineUsage(${rowId})">Submit</button>
                    </div>
                </div>
            </td>
        </tr>
    `;

    const clickedRow = document.querySelector(`#row-${rowId}`);
    if (clickedRow) {
        clickedRow.insertAdjacentHTML('afterend', additionalInfo);
        fetchMedicineData(); // Fetch medicine data when dropdown opens
    } else {
        console.error(`Row with ID #row-${rowId} not found`);
    }
}

// Add some basic CSS for suggestions
const style = document.createElement('style');
style.textContent = `
    .suggestions-container {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #ddd;
        display: none;
    }
    #medicineSearch:focus + .suggestions-container,
    .suggestions-container:hover {
        display: block;
    }
    .suggestion-item {
        padding: 5px;
        cursor: pointer;
    }
    .suggestion-item:hover {
        background-color: #f1f1f1;
    }
`;
document.head.appendChild(style);

// Existing event listeners and initialization remain the same
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    fetchMedicineData(); // Add this to load medicine data on page load

    document.querySelectorAll('th[data-colname]').forEach(header => {
        const column = header.getAttribute('data-colname');
        header.setAttribute('data-order', 'desc');
        header.addEventListener('click', () => sortTable(column, header));
    });
});

// Fetch all appointments (requires JWT)
app.get("/api/appointment", (req, res) => {
    const registrationNo = req.query.registrationNo; // Get the registration number from query parameters
    let query = "SELECT apmtid, name, age, appointment_date, status FROM appointment";
    let queryParams = [];

    if (registrationNo) {
        query += " WHERE registrationNo = ?"; // Assuming you have a column named registerNo in your appointment table
        queryParams.push(registrationNo);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "Database error",
                    error: err.message,
                });
        }
        res.json(results);
    });
});