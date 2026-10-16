import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

const getAgencyId = () => {
    const agencyId = auth.currentUser?.uid;
    if (!agencyId) {
        throw new Error('No logged-in agency user found.');
    }
    return agencyId;
};

const getPaymentDocument = async (paymentId) => {
    const paymentSnapshot = await getDoc(doc(db, 'payments', paymentId));
    if (!paymentSnapshot.exists()) {
        throw new Error('Payment not found.');
    }

    const payment = { id: paymentSnapshot.id, ...paymentSnapshot.data() };
    if (payment.agencyId !== getAgencyId()) {
        throw new Error('This payment does not belong to the current agency.');
    }

    return payment;
};

export const getAgencyPayments = async () => {
    try {
        const q = query(
            collection(db, 'payments'),
            where('agencyId', '==', getAgencyId())
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map((paymentSnapshot) => ({ id: paymentSnapshot.id, ...paymentSnapshot.data() }))
            .sort((a, b) => {
                const aTime = a.createdAt?.seconds ?? a.createdAt ?? 0;
                const bTime = b.createdAt?.seconds ?? b.createdAt ?? 0;
                return Number(bTime) - Number(aTime);
            });
    } catch (error) {
        throw new Error(`Failed to load agency payments: ${error.message}`);
    }
};

export const getPaymentByBookingId = async (bookingId) => {
    if (!bookingId) return null;

    const q = query(
        collection(db, 'payments'),
        where('agencyId', '==', getAgencyId()),
        where('bookingId', '==', bookingId)
    );
    const snapshot = await getDocs(q);
    const paymentSnapshot = snapshot.docs[0];
    return paymentSnapshot ? { id: paymentSnapshot.id, ...paymentSnapshot.data() } : null;
};

export const createOrUpdatePayment = async ({
    bookingId,
    customerName,
    workerName,
    workerId,
    serviceType,
    amount,
    status,
}) => {
    const agencyId = getAgencyId();
    const existingPayment = await getPaymentByBookingId(bookingId);
    const paymentData = {
        agencyId,
        bookingId,
        customerName: customerName || '',
        workerName: workerName || '',
        workerId: workerId || '',
        serviceType: serviceType || '',
        amount: Number(amount || 0),
        status,
    };

    if (existingPayment) {
        await updateDoc(doc(db, 'payments', existingPayment.id), {
            ...paymentData,
            ...(status === 'Paid' ? { paidAt: serverTimestamp() } : {}),
            updatedAt: serverTimestamp(),
        });
        return { ...existingPayment, ...paymentData };
    }

    const paymentSnapshot = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        createdAt: serverTimestamp(),
        ...(status === 'Paid' ? { paidAt: serverTimestamp() } : {}),
    });

    return { id: paymentSnapshot.id, ...paymentData };
};

export const markPaymentPaid = async (paymentId) => {
    const payment = await getPaymentDocument(paymentId);
    const paidAt = serverTimestamp();

    await updateDoc(doc(db, 'payments', paymentId), {
        status: 'Paid',
        paidAt,
        updatedAt: serverTimestamp(),
    });

    if (payment.bookingId) {
        await updateDoc(doc(db, 'bookings', payment.bookingId), {
            paymentStatus: 'Paid',
            updatedAt: serverTimestamp(),
        });
    }

    return { ...payment, status: 'Paid' };
};

const formatAmount = (amount) => `LKR ${Number(amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
    if (!value) return 'Recently';
    const date = value.toDate ? value.toDate() : value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();
};

export default function PaymentAgencyScreen({ navigation }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingPaymentId, setSavingPaymentId] = useState(null);

    const loadPayments = useCallback(async () => {
        try {
            const list = await getAgencyPayments();
            setPayments(list);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load payments.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadPayments();
        }, [loadPayments])
    );

    const paidTotal = payments
        .filter((payment) => payment.status === 'Paid')
        .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const pendingTotal = payments
        .filter((payment) => ['Pending', 'Overdue'].includes(payment.status))
        .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const handleMarkAsPaid = async (payment) => {
        try {
            setSavingPaymentId(payment.id);
            await markPaymentPaid(payment.id);
            await loadPayments();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not mark payment as paid.');
        } finally {
            setSavingPaymentId(null);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payments</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Collected</Text>
                    <Text style={styles.paidAmount}>{formatAmount(paidTotal)}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Pending</Text>
                    <Text style={styles.pendingAmount}>{formatAmount(pendingTotal)}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#5C8AF0" style={styles.loader} />
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPayments(); }} colors={['#5C8AF0']} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No payments yet.</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.paymentCard}
                            onPress={() => navigation.navigate('Bookings', { screen: 'BookingDetails', params: { bookingId: item.bookingId } })}
                        >
                            <View style={styles.paymentIcon}>
                                <Ionicons name="wallet-outline" size={20} color="#5C8AF0" />
                            </View>
                            <View style={styles.paymentInfo}>
                                <Text style={styles.customerName}>{item.customerName || 'Customer'}</Text>
                                <Text style={styles.paymentMeta}>{item.serviceType || 'Service'} • {formatDate(item.createdAt)}</Text>
                                <Text style={styles.paymentAmount}>{formatAmount(item.amount)}</Text>
                            </View>
                            <View style={styles.paymentActions}>
                                <Text style={[styles.statusText, item.status === 'Paid' ? styles.paidText : styles.pendingText]}>{item.status || 'Pending'}</Text>
                                {item.status !== 'Paid' ? (
                                    <TouchableOpacity style={styles.markPaidBtn} onPress={() => handleMarkAsPaid(item)} disabled={savingPaymentId === item.id}>
                                        {savingPaymentId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.markPaidText}>Mark as Paid</Text>}
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
    backBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: '#EEF2F6', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    headerSpacer: { width: 38 },
    summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 14 },
    summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EEF2F6', padding: 14 },
    summaryLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 6 },
    paidAmount: { color: '#10B981', fontSize: 16, fontWeight: '800' },
    pendingAmount: { color: '#F59E0B', fontSize: 16, fontWeight: '800' },
    loader: { marginTop: 30 },
    list: { paddingHorizontal: 20, paddingBottom: 24 },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
    paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F6', padding: 14, marginBottom: 12 },
    paymentIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    paymentInfo: { flex: 1 },
    customerName: { color: '#111827', fontSize: 14, fontWeight: '800' },
    paymentMeta: { color: '#6B7280', fontSize: 11, marginTop: 4 },
    paymentAmount: { color: '#111827', fontSize: 13, fontWeight: '800', marginTop: 5 },
    paymentActions: { alignItems: 'flex-end', marginLeft: 8 },
    statusText: { fontSize: 11, fontWeight: '800', marginBottom: 6 },
    paidText: { color: '#10B981' },
    pendingText: { color: '#F59E0B' },
    markPaidBtn: { backgroundColor: '#5C8AF0', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
    markPaidText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
