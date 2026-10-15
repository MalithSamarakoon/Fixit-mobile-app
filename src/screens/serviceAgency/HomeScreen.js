import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const getPaymentAmount = (payment) => {
    const amount = Number(String(payment.amount || 0).replace(/[^\d.-]/g, ''));
    return Number.isFinite(amount) ? amount : 0;
};

const getPaymentDate = (payment) => {
    if (payment.createdAt?.toDate) return payment.createdAt.toDate();
    if (payment.createdAt?.seconds) return new Date(payment.createdAt.seconds * 1000);
    return payment.createdAt ? new Date(payment.createdAt) : null;
};

const formatCurrency = (amount) => `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HomeScreen({ navigation }) {
    const [paymentSummary, setPaymentSummary] = useState({ collected: 0, pending: 0 });
    const [paymentLoading, setPaymentLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const recentBookings = [
        { id: 'BK-1001', name: 'Dinesh Perera', sub: 'Electrical • Colombo 03', status: 'Pending', time: '10:30 AM' },
        { id: 'BK-1002', name: 'Anura Silva', sub: 'Plumbing • Kandy', status: 'Confirmed', time: '02:15 PM' },
    ];

    const workerAvailability = [
        { id: 'worker-available', name: 'Kamal Fernando', status: 'Available', color: '#10B981', label: 'Available' },
        { id: 'worker-busy', name: 'Ruwan Silva', status: 'Busy', color: '#F59E0B', label: 'On Job' },
    ];

    const loadPaymentSummary = useCallback(async () => {
        const agencyId = auth.currentUser?.uid;
        if (!agencyId) {
            setPaymentSummary({ collected: 0, pending: 0 });
            setPaymentLoading(false);
            return;
        }

        try {
            const snapshot = await getDocs(query(collection(db, 'payments'), where('agencyId', '==', agencyId)));
            const now = new Date();
            const currentMonthPayments = snapshot.docs
                .map((paymentDoc) => paymentDoc.data())
                .filter((payment) => {
                    const date = getPaymentDate(payment);
                    return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
                });

            setPaymentSummary({
                collected: currentMonthPayments.filter((payment) => payment.status === 'Paid').reduce((total, payment) => total + getPaymentAmount(payment), 0),
                pending: currentMonthPayments.filter((payment) => ['Pending', 'Overdue'].includes(payment.status)).reduce((total, payment) => total + getPaymentAmount(payment), 0),
            });
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load payment summary.');
        } finally {
            setPaymentLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setPaymentLoading(true);
            loadPaymentSummary();
        }, [loadPaymentSummary])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadPaymentSummary();
    };

    const handlePaymentsPress = () => {
        navigation.navigate('paymentAgency');
    };

    const navigateToBookingsList = (filter) => {
        if (filter) {
            navigation.navigate('Bookings', { screen: 'BookingsList', params: { filter } });
            return;
        }
        navigation.navigate('Bookings', { screen: 'BookingsList' });
    };

    const navigateToWorkersList = (filter) => {
        if (filter) {
            navigation.navigate('Workers', { screen: 'WorkersList', params: { filter } });
            return;
        }
        navigation.navigate('Workers', { screen: 'WorkersList' });
    };

    const navigateToComplaints = () => {
        if (navigation.getParent && navigation.getParent()) {
            navigation.navigate('Home', { screen: 'Complaints' });
            return;
        }
        Alert.alert('Complaints', 'Coming soon');
    };

    const handleBookingDetails = (bookingId) => {
        navigation.navigate('Bookings', { screen: 'BookingDetails', params: { bookingId } });
    };

    const handleWorkerTap = (worker) => {
        navigation.navigate('Workers', { screen: 'WorkerProfile', params: { workerId: worker.id } });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>SL</Text>
                    </View>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back</Text>
                        <Text style={styles.agencyName}>QuickFix Sri Lanka</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bellBtn}>
                    <Ionicons name="notifications-outline" size={24} color="#111827" />
                    <View style={styles.bellDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#5C8AF0']} />}
            >
                <View style={styles.statsGrid}>
                    <TouchableOpacity style={styles.statCard} onPress={() => navigateToBookingsList('Pending')} activeOpacity={0.8}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#F59E0B' }]}>Pending</Text>
                        </View>
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Pending Bookings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statCard} onPress={() => navigateToBookingsList('Assigned')} activeOpacity={0.8}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="time-outline" size={20} color="#5C8AF0" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#5C8AF0' }]}>Active</Text>
                        </View>
                        <Text style={styles.statValue}>24</Text>
                        <Text style={styles.statLabel}>Active Jobs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statCard} onPress={() => navigateToWorkersList()} activeOpacity={0.8}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="people-outline" size={20} color="#10B981" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#10B981' }]}>Staff</Text>
                        </View>
                        <Text style={styles.statValue}>18</Text>
                        <Text style={styles.statLabel}>Registered Workers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statCard} onPress={navigateToComplaints} activeOpacity={0.8}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#EF4444' }]}>Urgent</Text>
                        </View>
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>Complaints</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.paymentsCard} onPress={handlePaymentsPress} activeOpacity={0.8}>
                    <View style={styles.paymentAccent} />
                    <View style={styles.paymentCardContent}>
                        <View style={styles.paymentHeader}>
                            <View style={styles.paymentTitleWrap}>
                                <View style={styles.paymentIconBox}>
                                    <Ionicons name="wallet-outline" size={21} color="#5C8AF0" />
                                </View>
                                <Text style={styles.paymentTitle}>Payments</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </View>

                        {paymentLoading ? (
                            <ActivityIndicator size="small" color="#5C8AF0" style={styles.paymentLoader} />
                        ) : (
                            <View style={styles.paymentValuesRow}>
                                <View style={styles.paymentValueBlock}>
                                    <Text style={styles.paymentValueLabel}>Collected</Text>
                                    <Text style={[styles.paymentValue, styles.collectedValue]}>{formatCurrency(paymentSummary.collected)}</Text>
                                </View>
                                <View style={styles.paymentValueBlock}>
                                    <Text style={styles.paymentValueLabel}>Pending</Text>
                                    <Text style={[styles.paymentValue, styles.pendingValue]}>{formatCurrency(paymentSummary.pending)}</Text>
                                </View>
                            </View>
                        )}
                        <Text style={styles.paymentPeriod}>This month</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Bookings</Text>
                    <TouchableOpacity onPress={() => navigateToBookingsList()} activeOpacity={0.8}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {recentBookings.map((booking) => (
                    <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => handleBookingDetails(booking.id)} activeOpacity={0.8}>
                        <View style={styles.bookingLeft}>
                            <View style={styles.bookingIconBox}>
                                <Ionicons name={booking.name === 'Dinesh Perera' ? 'flash-outline' : 'water-outline'} size={20} color="#5C8AF0" />
                            </View>
                            <View>
                                <Text style={styles.bookingName}>{booking.name}</Text>
                                <Text style={styles.bookingSub}>{booking.sub}</Text>
                            </View>
                        </View>
                        <View style={styles.bookingRight}>
                            <View style={booking.status === 'Pending' ? styles.pendingPill : styles.confirmedPill}>
                                <Text style={booking.status === 'Pending' ? styles.pendingPillText : styles.confirmedPillText}>{booking.status}</Text>
                            </View>
                            <Text style={styles.bookingTime}>{booking.time}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={styles.workerHeaderRow}>
                    <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 15 }]}>Worker Availability</Text>
                    <TouchableOpacity onPress={() => navigateToWorkersList()} activeOpacity={0.8}>
                        <Text style={styles.seeAllText}>See all</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.workerGrid}>
                    {workerAvailability.filter((worker) => worker.status !== 'Inactive').map((worker) => (
                        <TouchableOpacity
                            key={worker.id}
                            style={styles.workerCard}
                            onPress={() => handleWorkerTap(worker)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.dot, { backgroundColor: worker.color }]} />
                            <View style={styles.workerTextWrap}>
                                <Text style={styles.workerName}>{worker.name}</Text>
                                <TouchableOpacity
                                    onPress={(event) => {
                                        event.stopPropagation();
                                        const filter = worker.status === 'Available' ? 'Available' : 'Busy';
                                        navigateToWorkersList(filter);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.workerStatus}>{worker.label}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.addWorkerBtn} onPress={() => navigation.navigate('Workers', { screen: 'AddWorker' })} activeOpacity={0.8}>
                        <Ionicons name="person-add-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                        <Text style={styles.addWorkerText}>Add Worker</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.assignJobBtn} onPress={() => navigation.navigate('Home', { screen: 'NewJobAssignment' })} activeOpacity={0.8}>
                        <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.assignJobText}>Assign Job</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#EEF2FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#5C8AF0', fontSize: 16, fontWeight: 'bold' },
    welcomeText: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    agencyName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },

    bellBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center' },
    bellDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#fff' },

    container: { paddingHorizontal: 20, paddingBottom: 30 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15, marginBottom: 20 },
    statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
    statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 5 },
    statValue: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#6B7280' },

    paymentsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 20, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    paymentAccent: { width: 5, backgroundColor: '#C7D7FF' },
    paymentCardContent: { flex: 1, padding: 16 },
    paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    paymentTitleWrap: { flexDirection: 'row', alignItems: 'center' },
    paymentIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    paymentTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
    paymentValuesRow: { flexDirection: 'row', gap: 24 },
    paymentValueBlock: { flex: 1 },
    paymentValueLabel: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
    paymentValue: { fontSize: 17, fontWeight: '800' },
    collectedValue: { color: '#10B981' },
    pendingValue: { color: '#F59E0B' },
    paymentPeriod: { color: '#9CA3AF', fontSize: 11, marginTop: 12 },
    paymentLoader: { alignSelf: 'flex-start', marginVertical: 8 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    viewAllText: { fontSize: 13, color: '#5C8AF0', fontWeight: 'bold' },

    bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    bookingLeft: { flexDirection: 'row', alignItems: 'center' },
    bookingIconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    bookingName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    bookingSub: { fontSize: 12, color: '#6B7280' },
    bookingRight: { alignItems: 'flex-end' },
    pendingPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 5 },
    pendingPillText: { color: '#F59E0B', fontSize: 10, fontWeight: 'bold' },
    confirmedPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 5 },
    confirmedPillText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
    bookingTime: { fontSize: 11, color: '#A0A0A0' },

    workerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    workerCard: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    workerName: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    workerStatus: { fontSize: 11, color: '#6B7280' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    addWorkerBtn: { width: '48%', flexDirection: 'row', height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#6B7280', justifyContent: 'center', alignItems: 'center' },
    addWorkerText: { color: '#6B7280', fontSize: 14, fontWeight: 'bold' },
    assignJobBtn: { width: '48%', flexDirection: 'row', height: 50, borderRadius: 12, backgroundColor: '#5C8AF0', justifyContent: 'center', alignItems: 'center' },
    assignJobText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
