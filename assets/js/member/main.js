import { fetchAssignments } from './api.js';
import { showLoader, hideLoader, showError, displayResults } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    const performSearch = async () => {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) {
            alert('Masukkan ID terlebih dahulu!');
            return;
        }

        showLoader();
        try {
            const assignments = await fetchAssignments(query);
            displayResults(assignments);
        } catch (error) {
            alert('Terjadi kesalahan saat mencari data.');
            hideLoader();
        }
    };

    searchBtn.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});
