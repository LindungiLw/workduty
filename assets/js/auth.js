document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in via PIN
    if (localStorage.getItem('admin_auth') === 'true') {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const pinInput = document.getElementById('password').value.trim();
        
        if (pinInput === '120265') {
            // Set simple local storage auth
            localStorage.setItem('admin_auth', 'true');
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.innerText = "PIN salah!";
            errorContainer.classList.remove('hidden');
        }
    });
});
