import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { getAgencyBookings, getWorkerById, getWorkerJobHistory, getWorkersBusyToday, updateWorker } from './agencyService';

const tabs = ['Overview', 'Work History', 'Complaints'];

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toTimestampValue = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

const parseAmount = (value) => {
    if (typeof value === 'number') return value;
    const amount = Number(String(value || 0).replace(/[^\d.-]/g, ''));
    return Number.isFinite(amount) ? amount : 0;
};

const normalizeComplaint = (docSnap, sourceCollection) => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        agencyId: data.agencyId || '',
        bookingId: data.bookingId || data.booking || '',
        workerId: data.workerId || '',
        workerName: data.workerName || '',
        customerName: data.customerName || 'Customer',
        category: data.category || data.type || 'General',
        message: data.message || data.comment || '',
        status: data.status || 'Open',
        response: data.response || '',
        createdAt: data.createdAt || null,
        sourceCollection,
    };
};

export default function WorkerProfileScreen({ route, navigation }) {
    const { workerId, worker: workerParam } = route.params || {};
    const resolvedWorkerId = workerId || workerParam?.id;

    const [worker, setWorker] = useState(workerParam || null);
    const [bookings, setBookings] = useState([]);
    const [jobHistory, setJobHistory] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [busyWorkerIds, setBusyWorkerIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState('Overview');
    const [loading, setLoading] = useState(!workerParam && !!resolvedWorkerId);

    useEffect(() => {
        const loadData = async () => {
            if (!resolvedWorkerId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [workerData, historyData, agencyBookings, busyIds] = await Promise.all([
                    getWorkerById(resolvedWorkerId),
                    getWorkerJobHistory(resolvedWorkerId),
                    getAgencyBookings(),
                    getWorkersBusyToday(),
                ]);

                setWorker(workerData);
                setJobHistory([...historyData].sort((a, b) => {
                    const aTime = toTimestampValue(a.completedAt || a.createdAt);
                    const bTime = toTimestampValue(b.completedAt || b.createdAt);
                    return bTime - aTime;
                }));
                setBookings(agencyBookings);
                setBusyWorkerIds(busyIds);

                const agencyId = auth.currentUser?.uid;
                const bookingById = new Map(agencyBookings.map((item) => [item.id, item]));
                const fetchedComplaints = [];
                for (const collectionName of ['complaints', 'feedback']) {
                    const snapshot = await getDocs(collection(db, collectionName));
                    snapshot.forEach((docSnap) => {
                        const complaint = normalizeComplaint(docSnap, collectionName);
                        const booking = complaint.bookingId ? bookingById.get(complaint.bookingId) : null;
                        const matchesWorker = complaint.workerId === resolvedWorkerId
                            || booking?.assignedWorkerId === resolvedWorkerId
                            || (complaint.workerName && complaint.workerName === (workerData.fullName || workerData.name));
                        const matchesAgency = complaint.agencyId === agencyId || !!booking;
                        const matchesWorkerName = complaint.workerName && complaint.workerName === (workerData.fullName || workerData.name);
                        if (matchesWorker && (matchesAgency || matchesWorkerName)) fetchedComplaints.push(complaint);
                    });
                }

                const uniqueComplaints = Object.values(fetchedComplaints.reduce((result, item) => {
                    result[item.id] = item;
                    return result;
                }, {}));
                uniqueComplaints.sort((a, b) => toTimestampValue(b.createdAt) - toTimestampValue(a.createdAt));
                setComplaints(uniqueComplaints);
            } catch (error) {
                Alert.alert('Error', error.message || 'Could not load worker profile.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [resolvedWorkerId]);

    const initials = (worker?.fullName || worker?.name || 'Worker')
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    const isAvailable = worker?.status !== 'Inactive';
    const isBusyToday = isAvailable && busyWorkerIds.has(resolvedWorkerId);
    const availabilityLabel = worker?.status === 'Inactive' ? 'Inactive' : isBusyToday ? 'Busy today' : 'Available';
    const statusColor = availabilityLabel === 'Busy today' ? '#F59E0B' : availabilityLabel === 'Inactive' ? '#6B7280' : '#10B981';
    const statusBackground = availabilityLabel === 'Busy today' ? '#FFF7ED' : availabilityLabel === 'Inactive' ? '#F3F4F6' : '#EAFBF4';

    const activeJobs = useMemo(
        () => bookings.filter((item) => item.assignedWorkerId === resolvedWorkerId && !['Completed', 'Cancelled'].includes(item.status)).length,
        [bookings, resolvedWorkerId]
    );

    const recentCompletedJobs = useMemo(() => jobHistory.slice(0, 3), [jobHistory]);
    const upcomingJobs = useMemo(() => {
        const today = toDateKey(new Date());
        return bookings.filter((item) => item.assignedWorkerId === resolvedWorkerId
            && ['Assigned', 'In Progress'].includes(item.status)
            && item.preferredDate
            && item.preferredDate >= today);
    }, [bookings, resolvedWorkerId]);

    const openComplaints = useMemo(() => complaints.filter((item) => item.status === 'Open').length, [complaints]);

    const handleAvailabilityToggle = async (value) => {
        if (!worker || !resolvedWorkerId) {
            return;
        }

        if (!value && upcomingJobs.length > 0) {
            Alert.alert(
                `${worker.fullName || worker.name || 'Worker'} has ${upcomingJobs.length} upcoming job(s). Mark as inactive anyway?`,
                '',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes', style: 'destructive', onPress: () => handleAvailabilityToggleConfirmed(false) },
                ]
            );
            return;
        }

        await handleAvailabilityToggleConfirmed(value);
    };

    const handleAvailabilityToggleConfirmed = async (value) => {
        const nextStatus = value ? 'Available' : 'Inactive';
        try {
            const updatedWorker = await updateWorker(resolvedWorkerId, { status: nextStatus });
            setWorker({ ...worker, status: updatedWorker.status || nextStatus });
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not update worker availability.');
        }
    };

    const renderOverview = () => (
        <View>
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mobile</Text>
                    <Text style={styles.infoValue}>{worker?.phone || 'Not provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Worker Type</Text>
                    <Text style={styles.infoValue}>{worker?.workerType || worker?.rolePosition || worker?.trade || worker?.department || 'Not provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Start Date</Text>
                    <Text style={styles.infoValue}>{worker?.startDate || 'Not provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Active Jobs</Text>
                    <Text style={styles.infoValue}>{activeJobs}</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{jobHistory.length}</Text>
                    <Text style={styles.statLabel}>Completed jobs</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{openComplaints}</Text>
                    <Text style={styles.statLabel}>Open complaints</Text>
                </View>
            </View>

            <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Recent Completed Jobs</Text>
                {recentCompletedJobs.length === 0 ? (
                    <Text style={styles.emptyText}>No completed jobs yet.</Text>
                ) : (
                    recentCompletedJobs.map((item) => (
                        <View key={item.id} style={styles.jobRow}>
                            <View>
                                <Text style={styles.jobName}>{item.serviceType || 'Service Job'}</Text>
                                <Text style={styles.jobMeta}>{item.customerName || 'Customer'} • {item.preferredDate || item.date || 'No date'}</Text>
                            </View>
                            <View style={styles.badgeGreen}>
                                <Text style={styles.badgeGreenText}>{item.amount ? `LKR ${item.amount}` : 'Completed'}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </View>
    );

    const renderWorkHistory = () => (
        <View>
            <Text style={styles.completedCount}>{jobHistory.length} jobs completed</Text>
            {jobHistory.length === 0 ? (
                <View style={styles.sectionBox}><Text style={styles.emptyText}>No completed jobs yet</Text></View>
            ) : (
                jobHistory.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.sectionBox} onPress={() => navigation.navigate('Bookings', { screen: 'BookingDetails', params: { bookingId: item.id } })}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.jobName}>{item.serviceType || 'Service'}</Text>
                            <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Completed</Text></View>
                        </View>
                        <Text style={styles.jobMeta}>{item.customerName || 'Customer'}</Text>
                        <Text style={styles.jobMeta}>{item.preferredDate || 'No date'}{item.preferredTime ? ` • ${item.preferredTime}` : ''}</Text>
                        <Text style={styles.jobMeta}>{item.address || 'No address provided'}</Text>
                        <Text style={styles.amountText}>LKR {parseAmount(item.estimatedCost ?? item.total ?? item.amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    const renderComplaints = () => (
        <View>
            {complaints.length === 0 ? <Text style={styles.emptyText}>No complaints 🎉</Text> : complaints.map((item) => {
                const statusStyle = item.status === 'Resolved' ? styles.resolvedBadge : item.status === 'In Review' ? styles.reviewBadge : styles.openBadge;
                return (
                    <TouchableOpacity key={item.id} style={styles.sectionBox} onPress={() => navigation.navigate('Home', { screen: 'Complaints' })}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.jobName}>{item.customerName}</Text>
                            <View style={[styles.complaintBadge, statusStyle]}><Text style={styles.complaintBadgeText}>{item.status}</Text></View>
                        </View>
                        <Text style={styles.jobMeta}>Booking #{String(item.bookingId || 'N/A').slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.complaintCategory}>{item.category}</Text>
                        <Text style={styles.complaintMessage}>{item.message || 'No complaint message provided.'}</Text>
                        <Text style={styles.jobMeta}>{item.createdAt ? new Date(toTimestampValue(item.createdAt)).toLocaleDateString() : 'Recently'}</Text>
                        {item.status === 'Resolved' && item.response ? <Text style={styles.responseText}>{item.response}</Text> : null}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderTabContent = () => {
        if (activeTab === 'Work History') return renderWorkHistory();
        if (activeTab === 'Complaints') return renderComplaints();
        return renderOverview();
    };

    if (loading && !worker) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#5C8AF0" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Worker Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    </View>

                    <View style={styles.nameRow}>
                        <Text style={styles.workerName}>{worker?.fullName || worker?.name || 'Worker Name'}</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#5C8AF0" />
                    </View>

                    <View style={styles.statusWrap}>
                        <View style={[styles.statusPill, { backgroundColor: statusBackground }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{worker?.status || 'Available'}</Text>
                        </View>
                    </View>

                    <Text style={styles.tradeText}>{worker?.workerType || worker?.trade || worker?.department || 'General Worker'}</Text>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Available for jobs</Text>
                        <Switch
                            value={isAvailable}
                            onValueChange={handleAvailabilityToggle}
                            trackColor={{ false: '#E5E7EB', true: '#5C8AF0' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                <View style={styles.tabsRow}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab === 'Complaints' ? `Complaints (${complaints.length})` : tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {renderTabContent()}

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => navigation.navigate('Home', { screen: 'NewJobAssignment', params: { preselectedWorker: worker } })}
                    >
                        <Text style={styles.primaryBtnText}>Assign New Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => navigation.navigate('AddWorker', { worker })}
                    >
                        <Text style={styles.secondaryBtnText}>Edit Worker Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    scroll: { flex: 1 },
    container: { paddingHorizontal: 20, paddingBottom: 30 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FE' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 12,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    profileHeader: { alignItems: 'center', paddingTop: 10, marginBottom: 16 },
    avatarWrap: { marginBottom: 12 },
    avatarCircle: {
        width: 94,
        height: 94,
        borderRadius: 47,
        backgroundColor: '#EAF1FF',
        borderWidth: 2,
        borderColor: '#C7D7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 30, fontWeight: '800', color: '#111827' },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    workerName: { fontSize: 24, fontWeight: '800', color: '#111827', marginRight: 8 },
    statusWrap: { marginTop: 10, marginBottom: 6 },
    statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    statusText: { fontSize: 12, fontWeight: '700' },
    tradeText: { color: '#6B7280', fontSize: 14, fontWeight: '600', marginBottom: 10 },
    toggleRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        paddingVertical: 12,
        marginTop: 6,
    },
    toggleLabel: { color: '#111827', fontSize: 14, fontWeight: '600' },
    tabsRow: { flexDirection: 'row', backgroundColor: '#E9EEF8', borderRadius: 16, padding: 4, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    activeTab: { backgroundColor: '#fff' },
    tabText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
    activeTabText: { color: '#111827' },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    infoLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
    infoValue: { color: '#111827', fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EEF2F6', padding: 14 },
    statValue: { color: '#111827', fontSize: 20, fontWeight: '800' },
    statLabel: { color: '#6B7280', fontSize: 11, marginTop: 4 },
    sectionBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    completedCount: { color: '#111827', fontSize: 16, fontWeight: '800', marginBottom: 12 },
    jobRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    jobName: { color: '#111827', fontSize: 14, fontWeight: '700' },
    jobMeta: { color: '#6B7280', fontSize: 12, marginTop: 4 },
    badgeGreen: {
        backgroundColor: '#EAFBF4',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    badgeGreenText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
    amountText: { color: '#111827', fontSize: 14, fontWeight: '800', marginTop: 10 },
    complaintBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
    complaintBadgeText: { color: '#111827', fontSize: 10, fontWeight: '700' },
    openBadge: { backgroundColor: '#FEE2E2' },
    reviewBadge: { backgroundColor: '#FEF3C7' },
    resolvedBadge: { backgroundColor: '#DCFCE7' },
    complaintCategory: { color: '#5C8AF0', fontSize: 12, fontWeight: '700', marginBottom: 6 },
    complaintMessage: { color: '#374151', fontSize: 13, lineHeight: 20 },
    responseText: { color: '#6B7280', fontSize: 12, lineHeight: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    emptyText: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 8 },
    actionsRow: { gap: 12 },
    primaryBtn: {
        backgroundColor: '#5C8AF0',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    secondaryBtn: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D8E2F6',
    },
    secondaryBtnText: { color: '#5C8AF0', fontSize: 15, fontWeight: '700' },
});
