import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getAgencyBookings } from './agencyService';

const FILTERS = ['Open', 'In Review', 'Resolved'];

const categoryColors = {
    Service: '#E0F2FE',
    Delay: '#FEF3C7',
    Quality: '#DCFCE7',
    Payment: '#FDE68A',
    Safety: '#FEE2E2',
    General: '#E0E7FF',
};

const normalizeComplaint = (item, fallbackCollection) => {
    const data = item.data ? item.data() : item;
    return {
        id: item.id || data.id,
        agencyId: data.agencyId || '',
        bookingId: data.bookingId || data.booking || '',
        customerId: data.customerId || data.userId || '',
        customerName: data.customerName || 'Customer',
        workerName: data.workerName || 'Worker',
        category: data.category || data.type || 'General',
        message: data.message || data.comment || '',
        status: data.status || 'Open',
        response: data.response || '',
        createdAt: data.createdAt || null,
        resolvedAt: data.resolvedAt || null,
        sourceCollection: fallbackCollection,
    };
};

export default function ComplaintsScreen({ navigation }) {
    const [complaints, setComplaints] = useState([]);
    const [filter, setFilter] = useState('Open');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const loadComplaints = useCallback(async () => {
        try {
            const agencyId = auth.currentUser?.uid;
            if (!agencyId) {
                setComplaints([]);
                return;
            }

            const bookingList = await getAgencyBookings();
            const bookingIds = new Set(bookingList.map((booking) => booking.id));
            const fetched = [];

            const candidateCollections = ['complaints', 'feedback'];
            for (const collectionName of candidateCollections) {
                const snapshot = await getDocs(collection(db, collectionName));
                snapshot.forEach((docSnap) => {
                    const complaint = normalizeComplaint(docSnap, collectionName);
                    const matchesAgency = complaint.agencyId === agencyId;
                    const matchesBooking = complaint.bookingId && bookingIds.has(complaint.bookingId);
                    if (matchesAgency || matchesBooking) {
                        fetched.push({ ...complaint, agencyId: complaint.agencyId || agencyId });
                    }
                });
            }

            const unique = {};
            fetched.forEach((item) => {
                unique[item.id] = item;
            });

            const list = Object.values(unique).sort((a, b) => {
                const aTime = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const bTime = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return bTime - aTime;
            });

            setComplaints(list);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load complaints.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadComplaints();
        }, [loadComplaints])
    );

    const visibleComplaints = useMemo(() => {
        return complaints.filter((item) => item.status === filter || (filter === 'Open' && !item.status));
    }, [complaints, filter]);

    const openResponse = (complaint) => {
        setSelectedComplaint(complaint);
        setResponseText(complaint.response || '');
        setModalVisible(true);
    };

    const updateComplaint = async (nextStatus) => {
        if (!selectedComplaint) return;

        if (nextStatus === 'Resolved' && !responseText.trim()) {
            Alert.alert('Resolution required', 'Please enter a resolution message before resolving the complaint.');
            return;
        }

        try {
            const complaintRef = doc(db, selectedComplaint.sourceCollection || 'complaints', selectedComplaint.id);
            const payload = {
                status: nextStatus,
                response: responseText.trim(),
                agencyId: selectedComplaint.agencyId || auth.currentUser.uid,
                updatedAt: serverTimestamp(),
            };

            if (nextStatus === 'Resolved') {
                payload.resolvedAt = serverTimestamp();
            }

            await updateDoc(complaintRef, payload);

            if (nextStatus === 'Resolved') {
                await addDoc(collection(db, 'notifications'), {
                    userId: selectedComplaint.customerId || selectedComplaint.userId || '',
                    title: 'Complaint resolved',
                    message: responseText.trim(),
                    bookingId: selectedComplaint.bookingId || '',
                    read: false,
                    createdAt: serverTimestamp(),
                    type: 'complaint',
                });
            }

            setModalVisible(false);
            setSelectedComplaint(null);
            setResponseText('');
            await loadComplaints();
            Alert.alert('Success', `Complaint marked as ${nextStatus}.`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not update complaint.');
        }
    };

    const renderComplaintCard = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardTopRow}>
                <Text style={styles.customerName}>{item.customerName || 'Customer'}</Text>
                <View style={[styles.badge, { backgroundColor: categoryColors[item.category] || categoryColors.General }]}>
                    <Text style={styles.badgeText}>{item.category || 'General'}</Text>
                </View>
            </View>

            <Text style={styles.bookingId}>Booking #{String(item.bookingId || 'N/A').slice(0, 6).toUpperCase()}</Text>
            <Text style={styles.message} numberOfLines={3}>{item.message || 'No complaint message provided.'}</Text>
            <Text style={styles.dateText}>{item.createdAt && item.createdAt.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Recently'}</Text>

            <TouchableOpacity style={styles.respondBtn} onPress={() => openResponse(item)}>
                <Text style={styles.respondBtnText}>Respond</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Complaints</Text>
            </View>

            <View style={styles.filterRow}>
                {FILTERS.map((chip) => {
                    const active = filter === chip;
                    return (
                        <TouchableOpacity
                            key={chip}
                            style={[styles.chip, active && styles.chipActive, active && chip === 'Open' && styles.chipOpenActive]}
                            onPress={() => setFilter(chip)}
                        >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#5C8AF0" />
                </View>
            ) : (
                <FlatList
                    data={visibleComplaints}
                    keyExtractor={(item) => item.id}
                    renderItem={renderComplaintCard}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadComplaints(); }} colors={['#5C8AF0']} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No complaints found.</Text>}
                />
            )}

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Complaint Details</Text>
                        <Text style={styles.modalText}>{selectedComplaint?.customerName || 'Customer'} • {selectedComplaint?.category || 'General'}</Text>
                        <Text style={styles.modalText}>Booking: {selectedComplaint?.bookingId || 'N/A'}</Text>
                        <Text style={styles.modalText}>Message: {selectedComplaint?.message || 'No message'}</Text>

                        <Text style={styles.label}>Resolution message</Text>
                        <TextInput
                            style={styles.textArea}
                            value={responseText}
                            onChangeText={setResponseText}
                            multiline
                            placeholder="Write your resolution..."
                            placeholderTextColor="#A0A0A0"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={() => updateComplaint('In Review')}>
                                <Text style={styles.secondaryBtnText}>Mark In Review</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => updateComplaint('Resolved')}>
                                <Text style={styles.primaryBtnText}>Resolve</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 10 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    chipActive: { backgroundColor: '#EEF2FF', borderColor: '#5C8AF0' },
    chipOpenActive: { borderColor: '#EF4444' },
    chipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    chipTextActive: { color: '#111827' },
    list: { paddingHorizontal: 20, paddingBottom: 30 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        padding: 16,
        marginBottom: 14,
    },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    customerName: { fontSize: 16, fontWeight: '800', color: '#111827' },
    badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#111827' },
    bookingId: { color: '#6B7280', fontSize: 12, fontWeight: '600', marginBottom: 8 },
    message: { color: '#374151', fontSize: 13, lineHeight: 20 },
    dateText: { color: '#9CA3AF', fontSize: 11, marginTop: 8, marginBottom: 12 },
    respondBtn: {
        alignSelf: 'flex-end',
        backgroundColor: '#5C8AF0',
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    respondBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
    modalText: { color: '#374151', fontSize: 13, marginBottom: 6 },
    label: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 14, marginBottom: 6 },
    textArea: {
        minHeight: 110,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
        color: '#111827',
        textAlignVertical: 'top',
    },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
    secondaryBtn: {
        flex: 1,
        backgroundColor: '#EEF2FF',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginRight: 8,
    },
    secondaryBtnText: { color: '#5C8AF0', fontSize: 13, fontWeight: '700' },
    primaryBtn: {
        flex: 1,
        backgroundColor: '#5C8AF0',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginLeft: 8,
    },
    primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
