async function checkAndUploadIP() {
    const ipInput = document.getElementById('ipInput').value.trim();
    const messageBox = document.getElementById('messageBox');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const uploadBtn = document.getElementById('uploadBtn');

    messageBox.style.display = 'none';
    messageBox.className = 'message-box';

    // Strict IPv4 Format Validation Filter (Sirf IP format allow hoga)
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipv4Regex.test(ipInput)) {
        messageBox.style.display = 'block';
        messageBox.classList.add('error');
        messageBox.innerText = 'Invalid IP Format! Please enter a valid IPv4 address (e.g. 192.168.1.1)';
        return;
    }

    // UI Loading State On
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';
    uploadBtn.disabled = true;

    try {
        // Apne Cloudflare Worker ka URL yahan lagayein
        const response = await fetch('https://YOUR_WORKER_SUBDOMAIN.workers.dev/api/ip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip: ipInput })
        });

        const data = await response.json();

        messageBox.style.display = 'block';

        if (response.status === 409 || data.duplicate) {
            // Duplicate IP Message
            messageBox.classList.add('error');
            messageBox.innerText = 'Duplicate IP Please Create a new profile';
        } else if (response.ok) {
            // Success Message
            messageBox.classList.add('success');
            messageBox.innerText = 'Success! IP has been saved to the database.';
            document.getElementById('ipInput').value = '';
        } else {
            messageBox.classList.add('error');
            messageBox.innerText = data.error || 'Something went wrong. Please try again.';
        }

    } catch (error) {
        messageBox.style.display = 'block';
        messageBox.classList.add('error');
        messageBox.innerText = 'Network connection failed. Check your Worker URL.';
    } finally {
        // UI Loading State Off
        btnText.style.display = 'inline-block';
        loader.style.display = 'none';
        uploadBtn.disabled = false;
    }
}
