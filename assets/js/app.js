document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('resultContainer');
    const errorContainer = document.getElementById('errorContainer');

    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) {
            alert('Masukkan ID terlebih dahulu!');
            return;
        }

        searchSchedule(query);
    };

    function searchSchedule(studentId) {
        loader.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');

        db.collectionGroup('assignments').where('studentId', '==', studentId).get()
        .then(async (querySnapshot) => {
            if (!querySnapshot.empty) {
                const assignmentsData = [];
                
                const promises = querySnapshot.docs.map(async (doc) => {
                    const duty = doc.data();
                    const selectedDate = new Date().toLocaleDateString('en-CA');
                    
                    if (duty.type === 'petugas' && duty.date && duty.date !== selectedDate) return;

                    const roomRef = doc.ref.parent.parent;
                    let room = { roomName: 'Lokasi Terhapus', floor: '' };
                    try {
                        const roomDoc = await roomRef.get();
                        if (roomDoc.exists) room = roomDoc.data();
                    } catch (e) {
                        console.error(e);
                    }
                    assignmentsData.push({ duty, room });
                });

                await Promise.all(promises);
                
                if (assignmentsData.length === 0) {
                    loader.classList.add('hidden');
                    errorContainer.classList.remove('hidden');
                    return;
                }
                
                // No sorting needed anymore since there is only one date-based assignment.
                
                displayResults(assignmentsData);
                loader.classList.add('hidden');

            } else {
                loader.classList.add('hidden');
                errorContainer.classList.remove('hidden');
            }
        })
        .catch((error) => {
            console.error(error);
            loader.classList.add('hidden');
            alert('Terjadi kesalahan saat mencari data.');
        });
    }

    const displayResults = (assignments) => {
        resultContainer.innerHTML = '';
        
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
    };

    searchBtn.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});
