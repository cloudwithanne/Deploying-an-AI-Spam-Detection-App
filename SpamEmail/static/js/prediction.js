

    document.addEventListener('DOMContentLoaded', function() {
        const emailTextInput = document.getElementById('emailText');
        const sendButton = document.getElementById('sendButton');
        const resultContainer = document.getElementById('resultContainer');
        const spinnerOverlay = document.getElementById('spinnerOverlay');

        function showSpinner() {
            spinnerOverlay.style.display = 'flex';
        }

        function hideSpinner() {
            spinnerOverlay.style.display = 'none';
        }

        function displayResult(result) {
    // Remove any existing result first
    const existingResult = resultContainer.querySelector('.result-message');
    if (existingResult) {
        existingResult.remove();
    }

    let resultHTML = '';
    // Check if result is either "1" or 1 for Spam, else Not Spam
    if (result === "1" || result === 1) {
        resultHTML = `
            <div class="result-message result-spam">
                Spam 
            </div>
        `;
    } else {
        resultHTML = `
            <div class="result-message result-not-spam">
                Not Spam
            </div>
        `;
    }

    // Inserting the new result
    resultContainer.innerHTML = resultHTML;

    // Auto-dismiss after 5 seconds
    const messageElement = resultContainer.querySelector('.result-message');
    setTimeout(() => {
        if (messageElement) {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageElement.remove();
            }, 300);
        }
    }, 5000);
}

function analyzeEmail() {
    const emailText = emailTextInput.value.trim();
    
    if (!emailText) {
        alert('Please enter email content first');
        return;
    }

    showSpinner();
    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `text=${encodeURIComponent(emailText)}`
    })
    .then(response => response.json())
    .then(result => {
        hideSpinner();
        displayResult(result.result);
        emailTextInput.value = '';  // Clear the input field
    })
    .catch(error => {
        hideSpinner();
        console.error('Error:', error);
        resultContainer.innerHTML = `
            <div class="result-message text-danger">
                An error occurred while analyzing the email
            </div>
        `;

        // Auto-dismiss error message
        setTimeout(() => {
            const errorMessage = resultContainer.querySelector('.result-message');
            if (errorMessage) {
                errorMessage.classList.add('fade-out');
                setTimeout(() => {
                    errorMessage.remove();
                }, 300);
            }
        }, 5000);
    });
}



        // Send button click
        sendButton.addEventListener('click', analyzeEmail);

        // Enter key press Event
        emailTextInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                analyzeEmail();
            }
        });
    });


    /* for spam and non-spam modal */
   
function fetchEmails(type, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    
    // Adding loading indicator
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
    
    fetch(`/emails/${type}`)
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

            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row["S/N"]}</td>
                    <td>${row["Text"]}</td>
                    <td>${new Date(row["Time Detected"]).toLocaleString()}</td>
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

   // Adding event listeners for modal opening
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


  // Deleting email functionality
  function deleteEmail(type, id) {
    if (confirm('Are you sure you want to delete this email?')) {
        fetch(`/delete_email/${type}/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Refresh the table
                if (type === 'spam') {
                    fetchEmails('spam', 'spamTableBody');
                } else {
                    fetchEmails('non-spam', 'nonSpamTableBody');
                }
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


    //downloading function  for csv with error handling functionality
    function downloadCSV(type) {
    const downloadButton = event.target;
    downloadButton.disabled = true;
    downloadButton.textContent = 'Downloading...';

    fetch(`/download_csv/${type}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Download failed');
            }
            return response.text();  // Changed from blob() to text()
        })
        .then(data => {
            // Creating a Blob from the CSV string
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
