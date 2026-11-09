let messageTimer = null;

// Page load hone par input field par Enter key event listener lagana
document.addEventListener("DOMContentLoaded", () => {
    const ipInput = document.getElementById('ipInput');
    if (ipInput) {
        ipInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Default form submit ya refresh roknay ke liye
                checkAndUploadIP();
            }
        });
    }
});

async function checkAndUploadIP() {
    const ipInput = document.getElementById('ipInput').value.trim();
    const messageBox = document.getElementById('messageBox');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const uploadBtn = document.getElementById('uploadBtn');

    // Agar pehle se koi timer chal raha ho toh clear kardein
    if (messageTimer) clearTimeout(messageTimer);

    messageBox.style.display = 'none';
    messageBox.className = 'message-box';

    // Strict IPv4 Validation
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipv4Regex.test(ipInput)) {
        showMessage('error', '⚠️ Invalid IP Format! Please enter a valid IPv4 address.');
        return;
    }

    // Loading State
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';
    uploadBtn.disabled = true;

    try {
        // Yahan apna Worker URL check kar lein ke sahi laga ho
        const response = await fetch('https://green-tree-f545.myahyakhan984.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip: ipInput })
        });

        const data = await response.json();

        if (response.status === 409 || data.duplicate) {
            showMessage('error', '⚠️ IP Duplicate! Please Create a new Profile');
        } else if (response.ok) {
            showMessage('success', '✅ IP Uploaded Successfully!');
            document.getElementById('ipInput').value = '';
        } else {
            showMessage('error', '⚠️ ' + (data.error || 'Something went wrong.'));
        }

    } catch (error) {
        showMessage('error', '⚠️ Network connection failed. Check Worker URL.');
    } finally {
        btnText.style.display = 'inline-block';
        loader.style.display = 'none';
        uploadBtn.disabled = false;
    }
}

// Message dikhane aur 5 seconds baad auto-hide karne ka function
function showMessage(type, text) {
    const messageBox = document.getElementById('messageBox');
    messageBox.style.display = 'block';
    messageBox.className = `message-box ${type === 'success' ? 'success' : 'error'}`;
    messageBox.innerText = text;

    // 5 seconds (5000 milliseconds) tak message roke rakhne ke baad hide karna
    messageTimer = setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}
