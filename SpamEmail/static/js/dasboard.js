
    
// Function to fetch emails and populate the respective table
function fetchEmails(type, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    
    // Display loading indicator
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    fetch(`/emails/${type}`) // connecting to the email endpoint
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            tableBody.innerHTML = '';

            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No emails found</td></tr>';
                return;
            }

            // Populate the table with fetched data
            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row["S/N"] || 'N/A'}</td>
                    <td>${row["Text"] || 'No text provided'}</td>
                    <td>${row["Time Detected"] ? new Date(row["Time Detected"]).toLocaleString() : 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteEmail('${type}', ${row.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error fetching emails:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading emails</td></tr>';
        });
}

// Event listeners for modal open events
document.addEventListener('DOMContentLoaded', function() {
    const spamModal = document.getElementById('spamModal');
    const nonSpamModal = document.getElementById('nonSpamModal');

    spamModal.addEventListener('show.bs.modal', () => {
        fetchEmails('spam', 'spamTableBody');
    });

    nonSpamModal.addEventListener('show.bs.modal', () => {
        fetchEmails('non-spam', 'nonSpamTableBody');
    });
});

// Function to delete an email
function deleteEmail(type, id) {
    if (confirm('Are you sure you want to delete this email?')) {
        fetch(`/delete_email/${type}/${id}`, { // Connecting to the delete email route
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Refreshing the corresponding email table
                fetchEmails(type, type === 'spam' ? 'spamTableBody' : 'nonSpamTableBody');
            } else {
                alert('Error deleting email: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting email');
        });
    }
}

// Function to download CSV
function downloadCSV(type) {
    const downloadButton = event.target;
    downloadButton.disabled = true;
    downloadButton.textContent = 'Downloading...';

    fetch(`/download_csv/${type}`) // connecting to the download endpoint for CSV download
        .then(response => {
            if (!response.ok) {
                throw new Error('Download failed');
            }
            return response.text(); // Handle the CSV content as text
        })
        .then(data => {
            // Create a Blob from the CSV string
            const blob = new Blob([data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_emails.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error downloading CSV file');
        })
        .finally(() => {
            downloadButton.disabled = false;
            downloadButton.textContent = 'Download CSV';
        });
}
