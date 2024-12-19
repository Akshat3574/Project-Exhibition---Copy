let dataCache = [];

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
            <td colspan="4">
                <div class="details-content" style="padding: 10px;">
                    <div style="margin-bottom: 8px;">Additional details for ${dataCache[rowId]?.name || 'N/A'}</div>
                    <div>Last Updated on: ${formattedLastUpdated}</div>
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
    fetch('http://localhost:5000/api/data')
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
            console.log('Fetched data:', data);  // Log fetched data to verify structure
            dataCache = data;
            buildTable(dataCache);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('myTable').innerHTML = 
                '<tr><td colspan="4">Error loading data. Please try again later.</td></tr>';
        });
}

// Build table from data
function buildTable(data) {
    const tableBody = document.getElementById('myTable');
    tableBody.innerHTML = '';

    data.forEach((row, index) => {
        const expireDate = new Date(row.expire);
        const formattedDate = !isNaN(expireDate.getTime()) ? expireDate.toLocaleDateString('en-GB') : 'Invalid Date';

        const tr = document.createElement('tr');
        tr.id = `row-${index}`;
        tr.innerHTML = `
            <td>${row.name || 'N/A'}</td>
            <td>${row.count || 'N/A'}</td>
            <td>${formattedDate}</td>
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
        
        switch(column) {
            case 'count':
                comparison = (a.count || 0) - (b.count || 0);
                break;
            case 'expire':
                comparison = new Date(a.expire) - new Date(b.expire);
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

    // Prepare data for server update
    const updateData = {
        name: medicineName,
        count: requestedCount,
        expire: dataCache[rowId].expire // Assuming you want to keep the same expiration date
    };

    // Send update to server
    fetch('http://localhost:5000/api/update-medicine', {
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
    .then(result => {
        if (result.success) {
            alert('Medicine updated successfully');
            fetchData(); // Refresh the data after update
        } else {
            throw new Error(result.message || 'Update failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message || 'An error occurred while updating');
    });
}
