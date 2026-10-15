import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { assignWorkerToBooking, getAgencyWorkers, getBookingById, getBusyWorkerIds, isWorkerBusy } from './agencyService';

export default function AssignWorkerScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [busyWorkerIds, setBusyWorkerIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!bookingId) {
          throw new Error('No booking selected.');
        }

        const bookingData = await getBookingById(bookingId);
        setBooking(bookingData);

        const list = await getAgencyWorkers();
        const nextBusyWorkerIds = await getBusyWorkerIds(bookingData.preferredDate, bookingData.preferredTime);
        setBusyWorkerIds(nextBusyWorkerIds);
        const availableWorkers = list.filter((worker) => (worker.status || 'Available').toLowerCase() !== 'inactive');
        const serviceType = String(bookingData.serviceType || '').toLowerCase();

        if (!serviceType) {
          setWorkers(availableWorkers);
          return;
        }

        const matched = availableWorkers.filter((worker) => {
          const trade = String(worker.trade || worker.department || '').toLowerCase();
          return trade === serviceType || trade.includes(serviceType) || serviceType.includes(trade);
        });

        setWorkers(matched.length ? matched : availableWorkers);
      } catch (error) {
        Alert.alert('Error', error.message || 'Could not load workers.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bookingId]);

  const handleAssign = async (worker) => {
    if (!bookingId) {
      Alert.alert('Error', 'No booking selected.');
      return;
    }

    const workerName = worker.fullName || worker.name || 'Worker';
    Alert.alert('Assign worker', `Assign ${workerName} to this booking?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign',
        onPress: async () => {
          try {
            const busy = await isWorkerBusy(
              worker.id,
              booking?.preferredDate,
              booking?.preferredTime,
              bookingId
            );
            if (busy) {
              Alert.alert(`${workerName} is busy at this time. Please choose another worker or time.`);
              return;
            }

            await assignWorkerToBooking(bookingId, worker);
            await addDoc(collection(db, 'notifications'), {
              userId: worker.id,
              title: 'New job assigned',
              bookingId,
              read: false,
              createdAt: serverTimestamp(),
            });
            Alert.alert('Success', `${workerName} has been assigned.`);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error.message || 'Could not assign worker.');
          }
        },
      },
    ]);
  };

  const serviceType = booking?.serviceType || 'Service';
  const shortDescription = booking?.problemDescription || booking?.taskDescription || 'No description provided';
  const bookingIdShort = booking?.id ? String(booking.id).slice(0, 8).toUpperCase() : 'N/A';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Worker</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.bookingIdText}>{bookingIdShort}</Text>
            <View style={styles.pendingPill}>
              <Text style={styles.pendingPillText}>Pending Assign</Text>
            </View>
          </View>

          <Text style={styles.serviceType}>{serviceType}</Text>
          <Text style={styles.problemText}>{shortDescription.length > 120 ? `${shortDescription.slice(0, 120)}...` : shortDescription}</Text>

          <View style={styles.summaryInfoRow}>
            <Text style={styles.summaryLabel}>Customer</Text>
            <Text style={styles.summaryValue}>{booking?.customerName || 'Customer'}</Text>
          </View>
          <View style={styles.summaryInfoRow}>
            <Text style={styles.summaryLabel}>Address</Text>
            <Text style={styles.summaryValue}>{booking?.address || 'No address available'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Suggested {serviceType}s</Text>
          <Text style={styles.sortText}>Sort: Rating</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5C8AF0" />
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={workers}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No available workers for this service.</Text>}
            renderItem={({ item }) => {
              const workerName = item.fullName || item.name || 'Worker';
              const trade = item.trade || item.department || 'General Worker';
              const isBusy = busyWorkerIds.has(item.id);
              const rating = item.rating || '4.8';
              const initials = (workerName || 'W')
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase();

              return (
                <View style={styles.workerCard}>
                  <View style={styles.workerLeft}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <TouchableOpacity onPress={() => navigation.navigate('WorkerProfile', { worker: item })}>
                        <Text style={styles.workerName}>{workerName}</Text>
                      </TouchableOpacity>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.workerRating}> {rating}</Text>
                      </View>
                      <Text style={styles.workerTrade}>{trade}</Text>
                      {isBusy ? <Text style={styles.busyLabel}>Busy</Text> : null}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.assignBtn, isBusy && styles.assignBtnDisabled]}
                    disabled={isBusy}
                    onPress={() => handleAssign(item)}
                  >
                    <Text style={styles.assignBtnText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  scrollView: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 24 },
  centered: { paddingVertical: 30, alignItems: 'center' },
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
  summaryCard: {
    backgroundColor: '#EAF1FF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D9E6FF',
    marginBottom: 18,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bookingIdText: { color: '#111827', fontSize: 14, fontWeight: '700' },
  pendingPill: { backgroundColor: '#FFF7ED', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pendingPillText: { color: '#F59E0B', fontSize: 10, fontWeight: '700' },
  serviceType: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 6 },
  problemText: { color: '#4B5563', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  summaryInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  summaryLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  summaryValue: { color: '#111827', fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sortText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 30 },
  workerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  workerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#111827', fontSize: 14, fontWeight: '700' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  workerRating: { color: '#111827', fontSize: 12, fontWeight: '700' },
  workerTrade: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  busyLabel: { color: '#F59E0B', fontSize: 12, fontWeight: '700', marginTop: 2 },
  assignBtn: {
    backgroundColor: '#5C8AF0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  assignBtnDisabled: { backgroundColor: '#D1D5DB' },
  assignBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
