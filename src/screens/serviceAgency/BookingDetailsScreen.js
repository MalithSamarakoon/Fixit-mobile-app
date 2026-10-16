import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { getBookingById, getUserById, updateBooking } from './agencyService';

const statusColors = {
  'Request Sent': { bg: '#FEF3C7', text: '#D97706' },
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  Assigned: { bg: '#EEF2FF', text: '#5C8AF0' },
  'In Progress': { bg: '#E0F2FE', text: '#0284C7' },
  Completed: { bg: '#ECFDF5', text: '#10B981' },
  Confirmed: { bg: '#ECFDF5', text: '#10B981' },
  Cancelled: { bg: '#FEF2F2', text: '#EF4444' },
};

const normalizeStatus = (status) => (status === 'Request Sent' ? 'Pending' : status || 'Pending');

const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  if (!value && value !== 0) return 0;
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function BookingDetailsScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  const loadBooking = async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    try {
      const data = await getBookingById(bookingId);
      setBooking(data);

      if (data.userId) {
        const user = await getUserById(data.userId);
        setCustomer(user);
      }

      const agencyId = auth.currentUser?.uid;
      if (agencyId) {
        const paymentQuery = query(
          collection(db, 'payments'),
          where('agencyId', '==', agencyId),
          where('bookingId', '==', bookingId)
        );
        const paymentSnap = await getDocs(paymentQuery);
        if (!paymentSnap.empty) {
          const paymentDoc = paymentSnap.docs[0].data();
          setPaymentStatus(paymentDoc.status || 'Pending');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const bookingStatus = normalizeStatus(booking?.status);
  const statusStyle = statusColors[bookingStatus] || { bg: '#EEF2FF', text: '#5C8AF0' };
  const customerName = booking?.customerName || customer?.username || customer?.name || customer?.fullName || 'Customer';
  const customerPhone = booking?.customerPhone || customer?.mobile || 'Not available';
  const workerName = booking?.assignedWorkerName || 'Not assigned';
  const amount = parseAmount(booking?.estimatedCost ?? booking?.total ?? 0);
  const displayId = booking?.id ? booking.id.slice(0, 8).toUpperCase() : 'N/A';

  const handleOpenMaps = () => {
    const address = booking?.address || '';
    if (!address) {
      Alert.alert('No location', 'This booking does not include an address.');
      return;
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(mapsUrl);
  };

  const handleContactCustomer = () => {
    const mobile = String(customerPhone).replace(/[^+\d]/g, '');
    if (!mobile) {
      Alert.alert('No phone', 'Customer phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${mobile}`);
  };

  const handleCancelBooking = async () => {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateBooking(bookingId, {
              status: 'Cancelled',
              cancelledAt: new Date(),
            });
            await loadBooking();
            Alert.alert('Success', 'Booking marked as cancelled.');
          } catch (error) {
            Alert.alert('Error', error.message || 'Could not cancel booking.');
          }
        },
      },
    ]);
  };

  const handleMarkCompleted = async () => {
    try {
      const agencyId = auth.currentUser?.uid;
      if (!agencyId) {
        throw new Error('No logged-in agency found.');
      }

      await updateBooking(bookingId, {
        status: 'Completed',
        completedAt: new Date(),
      });

      const paymentQuery = query(
        collection(db, 'payments'),
        where('agencyId', '==', agencyId),
        where('bookingId', '==', bookingId)
      );
      const existingSnap = await getDocs(paymentQuery);

      if (existingSnap.empty) {
        await addDoc(collection(db, 'payments'), {
          agencyId,
          bookingId,
          customerName,
          workerName: workerName === 'Not assigned' ? 'Unassigned' : workerName,
          amount,
          status: 'Pending',
          createdAt: serverTimestamp(),
        });
      }

      await loadBooking();
      Alert.alert('Success', 'Booking marked as completed.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not mark booking as completed.');
    }
  };

  const customerInitials = useMemo(() => {
    if (!customerName) return 'CU';
    return customerName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [customerName]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#5C8AF0" />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyState}>Booking not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Text style={styles.bookingId}>{displayId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{bookingStatus}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{customerInitials}</Text>
            </View>
            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerPhone}>{customerPhone}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('CustomerProfile', { userId: booking.userId })}>
            <Text style={styles.linkText}>View customer profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#5C8AF0" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Service Request</Text>
          <View style={styles.tagRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{booking.serviceType || 'General Service'}</Text>
            </View>
          </View>
          <Text style={styles.description}>{booking.problemDescription || booking.taskDescription || 'No service description provided.'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{booking.preferredDate || 'Date not set'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{booking.preferredTime || 'Time not set'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Service Location</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color="#EF4444" />
            <Text style={styles.addressText}>{booking.address || 'Address not provided'}</Text>
          </View>
          <TouchableOpacity style={styles.mapsBtn} onPress={handleOpenMaps}>
            <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Estimated Cost</Text>
          <View style={styles.costRow}>
            <Text style={styles.costText}>LKR {amount.toLocaleString('en-LK')}</Text>
            <View style={[styles.paymentBadge, { backgroundColor: paymentStatus === 'Pending' ? '#FEF3C7' : '#ECFDF5' }]}>
              <Text style={[styles.paymentBadgeText, { color: paymentStatus === 'Pending' ? '#D97706' : '#10B981' }]}>
                {paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Assigned Worker</Text>
          <View style={styles.workerRow}>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{workerName}</Text>
              <Text style={styles.workerSub}>Agency assignment</Text>
            </View>
            <TouchableOpacity style={styles.assignBtn} onPress={() => navigation.navigate('AssignWorker', { bookingId: booking.id })}>
              <Text style={styles.assignBtnText}>{workerName === 'Not assigned' ? 'Assign' : 'Reassign'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionStack}>
          <TouchableOpacity style={styles.outlineBtn} onPress={handleContactCustomer}>
            <Text style={styles.outlineBtnText}>Contact Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelBooking}>
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleMarkCompleted}>
            <Text style={styles.primaryBtnText}>Mark as Completed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FE' },
  emptyState: { color: '#111827', fontSize: 16, fontWeight: '600' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#F8F9FE',
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
  headerTitleWrap: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  bookingId: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  container: { paddingHorizontal: 20, paddingBottom: 28 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#5C8AF0', fontSize: 18, fontWeight: '800' },
  customerMeta: { flex: 1 },
  customerName: { color: '#111827', fontSize: 17, fontWeight: '700' },
  customerPhone: { color: '#6B7280', fontSize: 13, marginTop: 3 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEF2F6' },
  linkText: { color: '#5C8AF0', fontWeight: '700', fontSize: 13 },
  sectionLabel: { color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  tagRow: { marginBottom: 10 },
  tagPill: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  tagText: { color: '#5C8AF0', fontSize: 11, fontWeight: '700' },
  description: { color: '#374151', fontSize: 14, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#6B7280', fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressText: { flex: 1, color: '#111827', fontSize: 14, lineHeight: 20 },
  mapsBtn: { marginTop: 16, borderWidth: 1, borderColor: '#5C8AF0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  mapsBtnText: { color: '#5C8AF0', fontSize: 14, fontWeight: '700' },
  costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  costText: { color: '#111827', fontSize: 28, fontWeight: '800' },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  paymentBadgeText: { fontSize: 11, fontWeight: '700' },
  workerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  workerInfo: { flex: 1 },
  workerName: { color: '#111827', fontSize: 16, fontWeight: '700' },
  workerSub: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  assignBtn: { backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  assignBtnText: { color: '#5C8AF0', fontWeight: '700', fontSize: 13 },
  actionStack: { marginTop: 8, marginBottom: 10 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#5C8AF0',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineBtnText: { color: '#5C8AF0', fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: '#5C8AF0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
