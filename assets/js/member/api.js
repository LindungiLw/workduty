export async function fetchAssignments(studentId) {
    const assignmentsData = [];
    try {
        const querySnapshot = await window.db.collectionGroup('assignments').where('studentId', '==', studentId).get();
        if (!querySnapshot.empty) {
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
        }
        return assignmentsData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
