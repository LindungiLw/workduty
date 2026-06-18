document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loader = document.getElementById('loader');

    // Tabs
    const tabSchedule = document.getElementById('tabSchedule');
    const tabMembers = document.getElementById('tabMembers');
    const scheduleSection = document.getElementById('scheduleSection');
    const membersSection = document.getElementById('membersSection');

    // Sections
    const roomsGrid = document.getElementById('roomsGrid');
    const membersTableBody = document.getElementById('membersTableBody');

    // Modals
    const roomModal = document.getElementById('roomModal');
    const placeModal = document.getElementById('placeModal');
    const detailModal = document.getElementById('detailModal');
    const masterMemberModal = document.getElementById('masterMemberModal');
    const assignModal = document.getElementById('assignModal');

    // Auth Check
    if (localStorage.getItem('admin_auth') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('admin_auth');
        window.location.href = 'index.html';
    });

    // Tab Switching Logic
    tabSchedule.addEventListener('click', (e) => {
        e.preventDefault();
        tabSchedule.classList.add('active');
        tabMembers.classList.remove('active');
        tabReports.classList.remove('active');

        scheduleSection.classList.add('active');
        scheduleSection.classList.remove('hidden');
        membersSection.classList.add('hidden');
        membersSection.classList.remove('active');
        reportsSection.classList.add('hidden');
        reportsSection.classList.remove('active');

        document.getElementById('pageTitle').innerText = 'Manajemen Jadwal';
        document.getElementById('floorFilterContainer').style.display = 'block';
        if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });

    tabMembers.addEventListener('click', (e) => {
        e.preventDefault();
        tabMembers.classList.add('active');
        tabSchedule.classList.remove('active');
        tabReports.classList.remove('active');

        membersSection.classList.add('active');
        membersSection.classList.remove('hidden');
        scheduleSection.classList.add('hidden');
        scheduleSection.classList.remove('active');
        reportsSection.classList.add('hidden');
        reportsSection.classList.remove('active');

        document.getElementById('pageTitle').innerText = 'Data Anggota';
        document.getElementById('floorFilterContainer').style.display = 'none';
        if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });

    tabReports.addEventListener('click', (e) => {
        e.preventDefault();
        tabReports.classList.add('active');
        tabSchedule.classList.remove('active');
        tabMembers.classList.remove('active');

        reportsSection.classList.add('active');
        reportsSection.classList.remove('hidden');
        scheduleSection.classList.add('hidden');
        scheduleSection.classList.remove('active');
        membersSection.classList.add('hidden');
        membersSection.classList.remove('active');

        document.getElementById('pageTitle').innerText = 'Laporan & Rekap';
        document.getElementById('floorFilterContainer').style.display = 'none';
        renderReports();
        if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });

    document.getElementById('printReportBtn').addEventListener('click', () => {
        const [year, month, day] = currentDate.split('-');
        const selectedDate = new Date(year, month - 1, day);
        document.getElementById('printDateDisplay').innerText = selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        window.print();
    });

    // Mobile Sidebar Toggle
    document.getElementById('hamburgerBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
    });

    document.getElementById('closeSidebarBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });

    // Local State
    let roomsData = {};
    let assignmentsData = {}; // Flat assignments per room
    let studentsData = {}; // Master Students
    let currentFloorFilter = 'all';
    let currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    // Setup Date Pickers
    const scheduleDateInput = document.getElementById('scheduleDateInput');
    const reportDateInput = document.getElementById('reportDateInput');

    if (scheduleDateInput) {
        scheduleDateInput.value = currentDate;
        scheduleDateInput.addEventListener('change', (e) => {
            currentDate = e.target.value;
            if (reportDateInput) reportDateInput.value = currentDate;
            renderRooms();
            renderUnassignedMembers();
        });
    }

    if (reportDateInput) {
        reportDateInput.value = currentDate;
        reportDateInput.addEventListener('change', (e) => {
            currentDate = e.target.value;
            if (scheduleDateInput) scheduleDateInput.value = currentDate;
            renderReports();
        });
    }

    function setupFloorFilterListeners() {
        const floorItems = document.querySelectorAll('.floor-item');
        floorItems.forEach(item => {
            item.addEventListener('click', (e) => {
                currentFloorFilter = item.getAttribute('data-floor');
                renderRooms();
                if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
            });
        });
    }

    function renderReports() {
        const totalRooms = Object.keys(roomsData).length;
        const totalMembers = Object.keys(studentsData).length;
        let totalAssignments = 0;

        // Map assignments to students
        const studentAssignments = {};
        Object.values(studentsData).forEach(s => {
            studentAssignments[s.studentId] = { name: s.studentName, task: '-' };
        });

        Object.entries(assignmentsData).forEach(([roomId, roomAssignments]) => {
            const roomName = roomsData[roomId]?.roomName || 'Lokasi Terhapus';
            Object.values(roomAssignments).forEach(item => {
                if (item.type === 'petugas' && item.studentId) {
                    if (item.date && item.date !== currentDate) return;
                    totalAssignments++;
                    if (studentAssignments[item.studentId]) {
                        const taskDesc = `${roomName} > ${item.placeName || ''} ${item.detailName ? '> ' + item.detailName : ''}`;
                        studentAssignments[item.studentId].task = taskDesc;
                    }
                } else if ((item.type === 'place' || item.type === 'detail') && item.studentId) {
                    totalAssignments++;
                    if (studentAssignments[item.studentId]) {
                        const taskDesc = `${roomName} > ${item.name || item.placeName || ''} (Legacy)`;
                        studentAssignments[item.studentId].task = taskDesc;
                    }
                }
            });
        });

        document.getElementById('statTotalRooms').innerText = totalRooms;
        document.getElementById('statTotalMembers').innerText = totalMembers;
        document.getElementById('statTotalAssignments').innerText = totalAssignments;

        const tbody = document.getElementById('reportsTableBody');
        tbody.innerHTML = '';

        const studentsArr = Object.values(studentAssignments).sort((a, b) => a.name.localeCompare(b.name));

        if (studentsArr.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada anggota terdaftar.</td></tr>';
            return;
        }

        studentsArr.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: 600;">${s.name}</td>
                    <td style="color: ${s.task !== '-' ? 'var(--text-primary)' : 'var(--danger-color)'}">${s.task}</td>
                </tr>
            `;
        });
    }

    // Fetch Data
    function fetchData() {
        // 1. Fetch Master Students
        db.collection('students').onSnapshot((snapshot) => {
            studentsData = {};
            snapshot.docs.forEach(doc => {
                studentsData[doc.id] = { id: doc.id, ...doc.data() };
            });
            renderMembersTable();
            populateAssignSelect();
        }, (err) => console.error(err));

        // 2. Fetch Rooms
        db.collection('rooms').onSnapshot((snapshot) => {
            roomsData = {};
            snapshot.docs.forEach(doc => {
                roomsData[doc.id] = doc.data();
            });
            renderRooms();
        }, (err) => console.error(err));

        // 3. Fetch Assignments (Tasks/Places/Details)
        db.collectionGroup('assignments').onSnapshot((snapshot) => {
            assignmentsData = {};
            snapshot.docs.forEach(doc => {
                const roomId = doc.ref.parent.parent.id;
                if (!assignmentsData[roomId]) assignmentsData[roomId] = {};

                const data = doc.data();
                // Map legacy data to 'place' type
                if (!data.type) data.type = 'place';
                if (!data.name) data.name = data.task;

                assignmentsData[roomId][doc.id] = data;
            });
            renderRooms();
        }, (err) => console.error(err));
    }

    fetchData();

    // ==========================================
    // RENDER FUNCTIONS
    // ==========================================

    function renderMembersTable() {
        membersTableBody.innerHTML = '';
        const students = Object.values(studentsData);

        if (students.length === 0) {
            membersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 15px;">Belum ada data anggota.</td></tr>';
            return;
        }

        // Sort by ID ascending
        students.sort((a, b) => a.studentId.localeCompare(b.studentId));

        students.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${student.studentId}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 600;">${student.studentName}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);"><span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">${student.studentFloor || 'Bebas'}</span></td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                    <button class="btn-small btn-edit" onclick="editMember('${student.id}')" style="margin-right: 5px;">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteMember('${student.id}')">Del</button>
                </td>
            `;
            membersTableBody.appendChild(tr);
        });
    }

    function populateAssignSelect() {
        const select = document.getElementById('assignStudentSelect');
        select.innerHTML = '<option value="">-- Pilih Anggota --</option>';

        const students = Object.values(studentsData).sort((a, b) => a.studentName.localeCompare(b.studentName));

        // Group by floor
        const grouped = {};
        students.forEach(student => {
            const floor = student.studentFloor || 'Bebas';
            if (!grouped[floor]) grouped[floor] = [];
            grouped[floor].push(student);
        });

        // Create optgroups
        Object.keys(grouped).sort().forEach(floor => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `Fokus: ${floor}`;

            grouped[floor].forEach(student => {
                const opt = document.createElement('option');
                opt.value = student.id;
                opt.text = `${student.studentName} (${student.studentId})`;
                optgroup.appendChild(opt);
            });

            select.appendChild(optgroup);
        });
    }

    function renderRooms() {
        if (loader) loader.classList.add('hidden');
        roomsGrid.innerHTML = '';

        // Extract unique floors for filter
        const uniqueFloors = new Set();
        Object.values(roomsData).forEach(r => {
            if (r.floor) uniqueFloors.add(r.floor);
        });

        // Populate sidebar floor list
        const sidebarFloorList = document.getElementById('sidebarFloorList');
        let filterHtml = `<li class="floor-item ${currentFloorFilter === 'all' ? 'active' : ''}" data-floor="all"><i class="fas fa-layer-group"></i> Semua Lantai</li>`;

        Array.from(uniqueFloors).sort().forEach(f => {
            filterHtml += `<li class="floor-item ${currentFloorFilter === f ? 'active' : ''}" data-floor="${f}"><i class="fas fa-building"></i> ${f}</li>`;
        });
        sidebarFloorList.innerHTML = filterHtml;
        setupFloorFilterListeners();

        if (Object.keys(roomsData).length > 0) {
            const grid = document.createElement('div');
            grid.className = 'rooms-grid';

            // Filter rooms by floor
            let filteredRooms = Object.entries(roomsData);
            if (currentFloorFilter !== 'all') {
                filteredRooms = filteredRooms.filter(([_, room]) => room.floor === currentFloorFilter);
            }

            // Convert to array and sort by Location Name
            const sortedRooms = filteredRooms.sort((a, b) => {
                const nameA = a[1].roomName || a[1].floor || '';
                const nameB = b[1].roomName || b[1].floor || '';
                return nameA.localeCompare(nameB);
            });

            sortedRooms.forEach(([roomId, room]) => {
                grid.appendChild(createRoomCard(roomId, room));
            });

            if (sortedRooms.length === 0) {
                roomsGrid.innerHTML = '<p style="text-align:center; width:100%;">Tidak ada lokasi di grup ini.</p>';
            } else {
                roomsGrid.appendChild(grid);
            }
        } else {
            roomsGrid.innerHTML = '<p>Belum ada data jadwal.</p>';
        }

        renderUnassignedMembers();
    }

    function renderUnassignedMembers() {
        const box = document.getElementById('unassignedMembersBox');
        box.innerHTML = '';

        // Get all assigned student IDs for the current date
        const assignedStudentIds = new Set();

        Object.values(assignmentsData).forEach(roomAssignments => {
            Object.values(roomAssignments).forEach(item => {
                if (item.type === 'petugas') {
                    if (item.studentId && (!item.date || item.date === currentDate)) {
                        assignedStudentIds.add(item.studentId);
                    }
                } else if ((item.type === 'place' || item.type === 'detail') && item.studentId) {
                    // Legacy applies to all dates
                    assignedStudentIds.add(item.studentId);
                }
            });
        });

        // Find unassigned
        const unassigned = Object.values(studentsData).filter(s => !assignedStudentIds.has(s.studentId));
        unassigned.sort((a, b) => a.studentId.localeCompare(b.studentId));

        if (unassigned.length === 0) {
            box.innerHTML = '<span style="color: green; font-weight: bold;">Semua anggota sudah mendapat tugas! 🎉</span>';
        } else {
            unassigned.forEach(s => {
                box.innerHTML += `<span style="background: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #ffe69c;">${s.studentName} (${s.studentId})</span>`;
            });
        }
    }

    function createRoomCard(roomId, room) {
        const card = document.createElement('div');
        card.className = 'room-card';

        const assignments = assignmentsData[roomId] || {};

        // Group by hierarchy
        const places = [];
        const detailsByPlace = {};
        const petugasByParent = {};

        for (const assignId in assignments) {
            const item = { id: assignId, ...assignments[assignId] };
            if (item.type === 'place') {
                places.push(item);
                // Backward compatibility for legacy places with studentId
                if (item.studentId && currentSession === 1) {
                    if (!petugasByParent[item.id]) petugasByParent[item.id] = [];
                    petugasByParent[item.id].push({
                        id: item.id,
                        studentId: item.studentId,
                        studentName: item.studentName,
                        isLegacy: true
                    });
                }
            } else if (item.type === 'detail') {
                if (!detailsByPlace[item.parentId]) detailsByPlace[item.parentId] = [];
                detailsByPlace[item.parentId].push(item);
                // Backward compatibility for legacy details with studentId
                if (item.studentId && currentSession === 1) {
                    if (!petugasByParent[item.id]) petugasByParent[item.id] = [];
                    petugasByParent[item.id].push({
                        id: item.id,
                        studentId: item.studentId,
                        studentName: item.studentName,
                        isLegacy: true
                    });
                }
            } else if (item.type === 'petugas') {
                if (!item.date || item.date === currentDate) {
                    if (!petugasByParent[item.parentId]) petugasByParent[item.parentId] = [];
                    petugasByParent[item.parentId].push(item);
                }
            }
        }

        function renderPetugasHtml(parentId, targetType, placeName, detailName) {
            const petugasList = petugasByParent[parentId] || [];
            let html = '';

            petugasList.forEach(p => {
                html += `
                    <div class="petugas-info" style="margin-bottom: 5px;">
                        <span><b>${p.studentName}</b> <small>(${p.studentId})</small></span>
                        <button class="btn-small btn-unassign" style="padding: 2px 5px; font-size: 0.8em; border-radius: 4px; margin-left: 5px;" onclick="unassignStudent('${roomId}', '${p.id}', ${!!p.isLegacy})">x</button>
                    </div>
                `;
            });

            // Always show the [+ Petugas] button to allow multiple assignees
            html += `<button class="btn-small" style="background: var(--primary-hover); color: white; padding: 4px 8px; margin-top: 5px;" onclick="openAssignModal('${roomId}', '${parentId}', '${targetType}', '${placeName.replace(/'/g, "\\'")}', '${detailName.replace(/'/g, "\\'")}')">+ Petugas</button>`;
            return html;
        }

        let placesHtml = '<div class="places-list">';

        if (places.length > 0) {
            places.forEach(place => {
                const hasDetails = detailsByPlace[place.id] && detailsByPlace[place.id].length > 0;
                const hasPetugas = petugasByParent[place.id] && petugasByParent[place.id].length > 0;

                let rightHtml = '';
                if (hasDetails) {
                    rightHtml = `
                        <button class="btn-small btn-edit" onclick="editPlace('${roomId}', '${place.id}')">Edit</button>
                        <button class="btn-small btn-delete" onclick="deletePlace('${roomId}', '${place.id}')">Del</button>
                    `;
                } else if (hasPetugas) {
                    rightHtml = `
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            ${renderPetugasHtml(place.id, 'place', place.name, '')}
                        </div>
                        <button class="btn-small btn-edit" onclick="editPlace('${roomId}', '${place.id}')">Edit</button>
                        <button class="btn-small btn-delete" onclick="deletePlace('${roomId}', '${place.id}')">Del</button>
                    `;
                } else {
                    rightHtml = `
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            ${renderPetugasHtml(place.id, 'place', place.name, '')}
                        </div>
                        <button class="btn-small btn-add" onclick="openDetailModal('${roomId}', '${place.id}', '${place.name.replace(/'/g, "\\'")}')">+ Detail Kerja</button>
                        <button class="btn-small btn-edit" onclick="editPlace('${roomId}', '${place.id}')">Edit</button>
                        <button class="btn-small btn-delete" onclick="deletePlace('${roomId}', '${place.id}')">Del</button>
                    `;
                }

                placesHtml += `
                    <div class="place-item">
                        <div class="place-header">
                            <div class="place-header-left">
                                <span style="font-size: 1.2em;">📍</span>
                                <span>${place.name}</span>
                            </div>
                            <div class="place-header-right">
                                ${rightHtml}
                            </div>
                        </div>
                `;

                // Render Details if any
                if (hasDetails) {
                    placesHtml += `<div class="details-list">`;
                    detailsByPlace[place.id].forEach(detail => {
                        placesHtml += `
                            <div class="detail-item">
                                <div class="detail-item-left">
                                    <span style="color: #999;">└─</span>
                                    <span>${detail.name}</span>
                                </div>
                                <div class="detail-item-right">
                                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                        ${renderPetugasHtml(detail.id, 'detail', detail.placeName || place.name, detail.name)}
                                    </div>
                                    <button class="btn-small btn-edit" onclick="editDetail('${roomId}', '${detail.id}')">Edit</button>
                                    <button class="btn-small btn-delete" onclick="deleteDetail('${roomId}', '${detail.id}')">Del</button>
                                </div>
                            </div>
                        `;
                    });

                    // Add "+ Detail Kerja" at the end of the details list
                    placesHtml += `
                        <div style="margin-top: 5px;">
                            <button class="btn-small btn-add" style="background: transparent; color: var(--primary-color); border: 1px dashed var(--primary-color); padding: 4px 8px;" onclick="openDetailModal('${roomId}', '${place.id}', '${place.name.replace(/'/g, "\\'")}')">+ Detail Kerja Baru</button>
                        </div>
                    </div>`;
                }

                placesHtml += `</div>`; // End place-item
            });
        } else {
            placesHtml += '<p style="text-align: center; color: #666; margin-top: 10px;">Belum ada Tempat WD di kamar ini.</p>';
        }
        placesHtml += '</div>';

        card.innerHTML = `
            <div class="room-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <div>
                    <h3>${room.roomName || room.floor}</h3>
                </div>
                <div class="action-btns">
                    <button class="btn-small btn-edit" onclick="editRoom('${roomId}')">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteRoom('${roomId}')">Del</button>
                </div>
            </div>
            ${placesHtml}
            <button class="btn-primary" style="width: 100%; margin-top: 15px; padding: 10px;" onclick="openPlaceModal('${roomId}')">+ Tambah Tempat WD</button>
        `;
        return card;
    }


    // ==========================================
    // ACTIONS: ROOMS (Locations)
    // ==========================================
    document.getElementById('addRoomBtn').onclick = () => {
        document.getElementById('roomModalTitle').innerText = 'Susun Jadwal (Lokasi)';
        document.getElementById('roomIdInput').value = '';
        document.getElementById('roomNameInput').value = '';
        roomModal.classList.remove('hidden');
    };

    document.getElementById('cancelRoomBtn').onclick = () => roomModal.classList.add('hidden');

    document.getElementById('saveRoomBtn').onclick = () => {
        const id = document.getElementById('roomIdInput').value;
        const name = document.getElementById('roomNameInput').value.trim();

        if (!name) return alert('Isi Lokasi / Area!');

        if (id) {
            db.collection('rooms').doc(id).update({ roomName: name, floor: name });
        } else {
            db.collection('rooms').add({ roomName: name, floor: name });
        }
        roomModal.classList.add('hidden');
    };

    window.editRoom = (roomId) => {
        const data = roomsData[roomId];
        if (data) {
            document.getElementById('roomModalTitle').innerText = 'Edit Lokasi';
            document.getElementById('roomIdInput').value = roomId;
            document.getElementById('roomNameInput').value = data.roomName || data.floor;
            roomModal.classList.remove('hidden');
        }
    };

    window.deleteRoom = (roomId) => {
        if (confirm('Yakin ingin menghapus kamar ini? (Hanya menghapus kamar, bukan tugas di dalamnya di Firestore)')) {
            db.collection('rooms').doc(roomId).delete();
        }
    };


    // ==========================================
    // ACTIONS: MASTER MEMBERS
    // ==========================================
    document.getElementById('addMemberBtn').onclick = () => {
        document.getElementById('masterMemberModalTitle').innerText = 'Tambah Anggota Baru';
        document.getElementById('masterMemberIdInput').value = '';
        document.getElementById('masterStudentIdInput').value = '';
        document.getElementById('masterStudentNameInput').value = '';
        masterMemberModal.classList.remove('hidden');
    };

    document.getElementById('cancelMasterMemberBtn').onclick = () => masterMemberModal.classList.add('hidden');

    document.getElementById('saveMasterMemberBtn').onclick = () => {
        const docId = document.getElementById('masterMemberIdInput').value;
        const studentId = document.getElementById('masterStudentIdInput').value.trim();
        const studentName = document.getElementById('masterStudentNameInput').value.trim();

        if (!studentId || !studentName) return alert('ID dan Nama wajib diisi!');

        if (docId) {
            db.collection('students').doc(docId).update({ studentId, studentName });
        } else {
            db.collection('students').add({ studentId, studentName });
        }
        masterMemberModal.classList.add('hidden');
    };

    window.editMasterMember = (docId) => {
        const data = studentsData[docId];
        if (data) {
            document.getElementById('masterMemberModalTitle').innerText = 'Edit Anggota';
            document.getElementById('masterMemberIdInput').value = docId;
            document.getElementById('masterStudentIdInput').value = data.studentId;
            document.getElementById('masterStudentNameInput').value = data.studentName;
            masterMemberModal.classList.remove('hidden');
        }
    };

    window.deleteMasterMember = (docId) => {
        if (confirm('Hapus anggota ini dari Master Data?')) {
            db.collection('students').doc(docId).delete();
        }
    };


    // ==========================================
    // ACTIONS: PLACES (Tempat WD)
    // ==========================================
    window.openPlaceModal = (roomId) => {
        document.getElementById('placeModalTitle').innerText = 'Tambah Tempat WD';
        document.getElementById('placeRoomIdInput').value = roomId;
        document.getElementById('placeAssignIdInput').value = '';
        document.getElementById('placeNameInput').value = '';
        placeModal.classList.remove('hidden');
    };

    document.getElementById('cancelPlaceBtn').onclick = () => placeModal.classList.add('hidden');

    document.getElementById('savePlaceBtn').onclick = () => {
        const roomId = document.getElementById('placeRoomIdInput').value;
        const assignId = document.getElementById('placeAssignIdInput').value;
        const name = document.getElementById('placeNameInput').value.trim();

        if (!name) return alert('Nama Tempat WD wajib diisi!');

        const assignRef = db.collection('rooms').doc(roomId).collection('assignments');

        if (assignId) {
            assignRef.doc(assignId).update({ name, task: name });
        } else {
            assignRef.add({ type: 'place', name, task: name, studentId: '', studentName: '' });
        }
        placeModal.classList.add('hidden');
    };

    window.editPlace = (roomId, assignId) => {
        const data = assignmentsData[roomId]?.[assignId];
        if (data) {
            document.getElementById('placeModalTitle').innerText = 'Edit Tempat WD';
            document.getElementById('placeRoomIdInput').value = roomId;
            document.getElementById('placeAssignIdInput').value = assignId;
            document.getElementById('placeNameInput').value = data.name || data.task || '';
            placeModal.classList.remove('hidden');
        }
    };

    window.deletePlace = (roomId, assignId) => {
        if (confirm('Hapus Tempat WD ini? Semua detail di dalamnya akan kehilangan induknya.')) {
            db.collection('rooms').doc(roomId).collection('assignments').doc(assignId).delete();
        }
    };


    // ==========================================
    // ACTIONS: DETAILS (Detail Kerja)
    // ==========================================
    window.openDetailModal = (roomId, placeId, placeName) => {
        document.getElementById('detailModalTitle').innerText = 'Tambah Detail Kerja';
        document.getElementById('detailRoomIdInput').value = roomId;
        document.getElementById('detailPlaceIdInput').value = placeId;
        document.getElementById('detailParentNameDisplay').innerText = placeName;
        document.getElementById('detailAssignIdInput').value = '';
        document.getElementById('detailNameInput').value = '';
        detailModal.classList.remove('hidden');
    };

    document.getElementById('cancelDetailBtn').onclick = () => detailModal.classList.add('hidden');

    document.getElementById('saveDetailBtn').onclick = () => {
        const roomId = document.getElementById('detailRoomIdInput').value;
        const placeId = document.getElementById('detailPlaceIdInput').value;
        const placeName = document.getElementById('detailParentNameDisplay').innerText;
        const assignId = document.getElementById('detailAssignIdInput').value;
        const name = document.getElementById('detailNameInput').value.trim();

        if (!name) return alert('Nama Detail Kerja wajib diisi!');

        const assignRef = db.collection('rooms').doc(roomId).collection('assignments');

        if (assignId) {
            assignRef.doc(assignId).update({ name });
        } else {
            assignRef.add({ type: 'detail', parentId: placeId, placeName, name, studentId: '', studentName: '' });
        }
        detailModal.classList.add('hidden');
    };

    window.editDetail = (roomId, assignId) => {
        const data = assignmentsData[roomId]?.[assignId];
        if (data) {
            document.getElementById('detailModalTitle').innerText = 'Edit Detail Kerja';
            document.getElementById('detailRoomIdInput').value = roomId;
            document.getElementById('detailPlaceIdInput').value = data.parentId;
            document.getElementById('detailParentNameDisplay').innerText = data.placeName || 'Induk';
            document.getElementById('detailAssignIdInput').value = assignId;
            document.getElementById('detailNameInput').value = data.name || '';
            detailModal.classList.remove('hidden');
        }
    };

    window.deleteDetail = (roomId, assignId) => {
        if (confirm('Hapus Detail Kerja ini?')) {
            db.collection('rooms').doc(roomId).collection('assignments').doc(assignId).delete();
        }
    };

    // ==========================================
    // ACTIONS: ASSIGN (Tap Tap)
    // ==========================================
    window.openAssignModal = (roomId, targetId, targetType, placeName, detailName) => {
        document.getElementById('assignRoomIdInput').value = roomId;
        document.getElementById('assignTaskIdInput').value = targetId;
        document.getElementById('assignTargetTypeInput').value = targetType;
        document.getElementById('assignPlaceNameInput').value = placeName;
        document.getElementById('assignDetailNameInput').value = detailName;
        document.getElementById('assignStudentSelect').value = '';
        assignModal.classList.remove('hidden');
    };

    document.getElementById('cancelAssignBtn').onclick = () => assignModal.classList.add('hidden');

    document.getElementById('saveAssignBtn').onclick = () => {
        const roomId = document.getElementById('assignRoomIdInput').value;
        const targetId = document.getElementById('assignTaskIdInput').value;
        const targetType = document.getElementById('assignTargetTypeInput').value;
        const placeName = document.getElementById('assignPlaceNameInput').value;
        const detailName = document.getElementById('assignDetailNameInput').value;
        const studentDocId = document.getElementById('assignStudentSelect').value;

        if (!studentDocId) return alert('Silakan pilih anggota terlebih dahulu!');

        const student = studentsData[studentDocId];
        if (!student) return alert('Anggota tidak valid!');

        // --- NEW COLLISION DETECTION LOGIC ---
        let hasConflict = null;

        for (const rId in assignmentsData) {
            const roomAssignments = assignmentsData[rId];
            for (const aId in roomAssignments) {
                const item = roomAssignments[aId];
                if (item.type === 'petugas' && item.studentId === student.studentId && (!item.date || item.date === currentDate)) {
                    hasConflict = `${item.placeName || ''} ${item.detailName ? '> ' + item.detailName : ''}`;
                    break;
                }
            }
            if (hasConflict) break;
        }

        if (hasConflict) {
            return alert(`PERINGATAN: ${student.studentName} sudah memiliki tugas pada tanggal ini (${hasConflict}). Setiap anggota hanya mendapat 1 tugas per hari!`);
        }
        // --- END COLLISION DETECTION LOGIC ---

        db.collection('rooms').doc(roomId).collection('assignments').add({
            type: 'petugas',
            parentId: targetId,
            studentId: student.studentId,
            studentName: student.studentName,
            placeName: placeName,
            detailName: detailName,
            date: currentDate
        }).then(() => {
            assignModal.classList.add('hidden');
            showToast('Tugas berhasil ditambahkan!');
        }).catch(err => {
            console.error(err);
            showToast('Gagal menugaskan anggota.', true);
        });
    };

    window.unassignStudent = (roomId, docId, isLegacy) => {
        if (confirm('Lepaskan anggota dari tugas ini?')) {
            const assignRef = db.collection('rooms').doc(roomId).collection('assignments').doc(docId);
            if (isLegacy) {
                assignRef.update({
                    studentId: '',
                    studentName: ''
                }).then(() => showToast('Tugas (Legacy) berhasil dilepas!'));
            } else {
                assignRef.delete().then(() => showToast('Tugas berhasil dilepas!'));
            }
        }
    };

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    window.showToast = (message, isError = false) => {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : ''}`;
        toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ==========================================
    // BULK RESET
    // ==========================================
    const bulkResetBtn = document.getElementById('bulkResetBtn');
    if (bulkResetBtn) {
        bulkResetBtn.addEventListener('click', () => {
            if (confirm(`Peringatan: Anda akan menghapus SEMUA tugas petugas kebersihan pada tanggal ${currentDate}.\n\n(Catatan: Ini tidak akan menghapus data Lokasi atau Tempat Induk). Lanjutkan?`)) {
                
                const batch = db.batch();
                let count = 0;

                for (const roomId in assignmentsData) {
                    const roomAssignments = assignmentsData[roomId];
                    for (const assignId in roomAssignments) {
                        const item = roomAssignments[assignId];
                        
                        // We only bulk delete assignments that are tied to this exact date
                        if (item.type === 'petugas' && item.date === currentDate) {
                            const ref = db.collection('rooms').doc(roomId).collection('assignments').doc(assignId);
                            batch.delete(ref);
                            count++;
                        }
                    }
                }

                if (count === 0) {
                    showToast('Tidak ada tugas di tanggal ini untuk dikosongkan.', true);
                    return;
                }

                batch.commit().then(() => {
                    showToast(`Berhasil mengosongkan ${count} tugas!`);
                }).catch((err) => {
                    console.error(err);
                    showToast('Gagal mereset tugas', true);
                });
            }
        });
    }

});
