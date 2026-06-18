const resultContainer = document.getElementById('resultContainer');
const errorContainer = document.getElementById('errorContainer');
const loader = document.getElementById('loader');

export function showLoader() {
    loader.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
}

export function hideLoader() {
    loader.classList.add('hidden');
}

export function showError() {
    hideLoader();
    errorContainer.classList.remove('hidden');
}

export function displayResults(assignments) {
    resultContainer.innerHTML = '';
    if (assignments.length === 0) {
        showError();
        return;
    }
    
    assignments.forEach(({ room, duty }) => {
        const type = duty.type;
        let tempatWD = '';
        let rincian = '';

        if (type === 'petugas') {
            tempatWD = duty.placeName || '-';
            rincian = duty.detailName || '-';
        } else if (type === 'detail') {
            tempatWD = duty.placeName || 'Tempat Induk';
            rincian = duty.name;
        } else {
            tempatWD = duty.name || duty.task;
            rincian = duty.boundaries || '-';
        }

        resultContainer.innerHTML += `
            <div class="result-card" style="margin-bottom: 25px;">
                <div class="student-header">
                    <div class="student-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="student-info">
                        <h2>${duty.studentName}</h2>
                        <p>ID: ${duty.studentId || '-'}</p>
                    </div>
                </div>
                
                <div class="duty-details">
                    <div class="duty-item">
                        <div class="duty-icon location">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="duty-text">
                            <span class="duty-label">Lokasi / Area</span>
                            <span class="duty-value">${room.roomName || room.floor}</span>
                        </div>
                    </div>
                    
                    <div class="duty-item">
                        <div class="duty-icon task">
                            <i class="fas fa-broom"></i>
                        </div>
                        <div class="duty-text">
                            <span class="duty-label">Tempat Work Duty</span>
                            <span class="duty-value">${tempatWD}</span>
                        </div>
                    </div>

                    <div class="duty-item" style="grid-column: 1 / -1;">
                        <div class="duty-icon detail">
                            <i class="fas fa-clipboard-list"></i>
                        </div>
                        <div class="duty-text">
                            <span class="duty-label">Rincian Kerjaan</span>
                            <span class="duty-value">${rincian}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    resultContainer.classList.remove('hidden');
    hideLoader();
}
