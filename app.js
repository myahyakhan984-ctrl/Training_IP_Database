/**
 * USA IP Database - Upload Only
 */

const API_URL = 'https://usa-ip-api.mshoaib-archnetix.workers.dev';

class UploadIP {
    constructor() {
        console.log('✅ App Started');
        console.log('📡 API:', API_URL);
        this.attachListeners();
    }

    attachListeners() {
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadIP();
        });
    }

    // Automatically retry if browser connection fails
    async fetchWithRetry(url, options, maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`📡 Request attempt: ${attempt}`);

                return await fetch(url, {
                    ...options,
                    cache: 'no-store'
                });

            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, error);

                if (attempt === maxAttempts) {
                    throw error;
                }

                await new Promise(resolve =>
                    setTimeout(resolve, attempt * 1000)
                );
            }
        }
    }

    async uploadIP() {
        const ipInput = document.getElementById('ipInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const notification = document.getElementById('uploadNotification');

        const ip = ipInput.value.trim();

        if (!ip) {
            this.showNotification(
                notification,
                'error',
                '❌ Please enter an IP address'
            );
            return;
        }

        uploadBtn.disabled = true;

        try {
            console.log('📤 Uploading:', ip);

            const response = await this.fetchWithRetry(
                `${API_URL}/api/upload-ip`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ip_address: ip
                    })
                }
            );

            const data = await response.json();

            console.log('📥 Response:', data);

            if (data.success) {
                this.showNotification(
                    notification,
                    'success',
                    `✅ ${data.message}`
                );

                ipInput.value = '';
                ipInput.focus();

            } else if (data.status === 'duplicate') {
                this.showNotification(
                    notification,
                    'error',
                    `⚠️ ${data.message}`
                );

            } else if (data.status === 'invalid') {
                this.showNotification(
                    notification,
                    'error',
                    `❌ ${data.message}`
                );

            } else {
                this.showNotification(
                    notification,
                    'error',
                    `❌ ${data.message || 'Upload failed'}`
                );
            }

        } catch (error) {
            console.error('Final Upload Error:', error);

            this.showNotification(
                notification,
                'error',
                '❌ Connection failed after 3 attempts. Please try again.'
            );

        } finally {
            uploadBtn.disabled = false;
        }
    }

    showNotification(container, type, message) {
        container.className = `notification show ${type}`;
        container.textContent = message;

        setTimeout(() => {
            container.classList.remove('show');
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UploadIP();
});
