import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CalendarPickerModal from './CalendarPickerModal';

export default function BookingsScreen({ navigation, route }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);

    const filters = ['All', 'Pending', 'Assigned', 'Completed'];

    useEffect(() => {
        const agencyId = auth.currentUser?.uid;
        if (!agencyId) {
            setBookings([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'bookings'),
            where('agencyId', '==', agencyId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            setBookings(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const nextFilter = route?.params?.filter;
        if (nextFilter && filters.includes(nextFilter)) {
            setActiveFilter(nextFilter);
        } else if (route?.params && !nextFilter) {
            setActiveFilter('All');
        }
    }, [route?.params]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return { bg: '#ECFDF5', text: '#10B981' };
            case 'Assigned': return { bg: '#EEF2FF', text: '#5C8AF0' };
            case 'Cancelled': return { bg: '#FEF2F2', text: '#EF4444' };
            default: return { bg: '#FEF3C7', text: '#D97706' };
        }
    };

    const matchesFilter = (bookingStatus, filter) => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return ['Pending', 'Request Sent'].includes(bookingStatus);
        if (filter === 'Assigned') return ['Assigned', 'In Progress'].includes(bookingStatus);
        return bookingStatus === filter;
    };

    const filteredBookings = bookings
        .filter((booking) => matchesFilter(booking.status, activeFilter))
        .filter((item) => {
            if (dateFilter) {
                const bookingDate = item.preferredDate || item.date || '';
                if (bookingDate !== dateFilter) return false;
            }
            const term = searchQuery.trim().toLowerCase();
            if (!term) return true;
            const refText = String(item.ref || item.id || '').toLowerCase();
            const clientText = String(item.customerName || item.client || '').toLowerCase();
            return refText.includes(term) || clientText.includes(term);
        });

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const refLabel = item.ref || `#BK-${String(item.id || '').slice(0, 5).toUpperCase()}`;
        const serviceText = item.serviceType || item.service || 'Service Request';
        const clientText = item.customerName || item.client || 'Client';
        const workerText = item.assignedWorkerName || item.worker || 'Unassigned';
        const timeText = item.preferredDate || item.time || 'No date';
        const isPending = ['Pending', 'Request Sent'].includes(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <Text style={styles.refText}>{refLabel}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                </View>

                <Text style={styles.serviceText}>{serviceText}</Text>
                <Text style={styles.infoText}>Client: {clientText}</Text>
                <Text style={styles.infoText}>Worker: {workerText}</Text>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                    <Text style={styles.timeText}>{timeText}</Text>
                    <View style={styles.actionRow}>
                        {isPending && (
                            <TouchableOpacity style={styles.assignSmallBtn} onPress={() => navigation.navigate('AssignWorker', { bookingId: item.id })}>
                                <Text style={styles.assignSmallBtnText}>Assign</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.detailsBtn} onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}>
                            <Text style={styles.detailsBtnText}>Details </Text>
                            <Ionicons name="chevron-forward" size={12} color="#5C8AF0" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bookings</Text>
                <View style={styles.headerActions}>
                    {dateFilter ? (
                        <TouchableOpacity style={styles.clearDateBtn} onPress={() => setDateFilter('')}>
                            <Text style={styles.clearDateText}>Clear</Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={styles.calendarBtn} onPress={() => setCalendarModalVisible(true)}>
                        <Ionicons name="calendar-outline" size={20} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search booking ID or client..."
                    placeholderTextColor="#A0A0A0"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {dateFilter ? (
                <View style={styles.activeDateRow}>
                    <Text style={styles.activeDateLabel}>Filtered on</Text>
                    <Text style={styles.activeDateText}>{new Date(`${dateFilter}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')}</Text>
                </View>
            ) : null}

            <View style={styles.filterWrapper}>
                <FlatList
                    horizontal
                    data={filters}
                    keyExtractor={item => item}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isActive = activeFilter === item;
                        return (
                            <TouchableOpacity
                                style={[styles.filterChip, isActive && styles.activeFilterChip]}
                                onPress={() => setActiveFilter(item)}
                            >
                                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#5C8AF0" style={{ marginTop: 30 }} />
            ) : (
                <FlatList
                    data={filteredBookings}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
                />
            )}

            <CalendarPickerModal
                visible={calendarModalVisible}
                selectedDate={dateFilter}
                minDate={new Date().toISOString().slice(0, 10)}
                title="Filter bookings by date"
                onSelect={(date) => {
                    setDateFilter(date || '');
                    setCalendarModalVisible(false);
                }}
                onClose={() => setCalendarModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },

    topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    clearDateBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EEF2FF' },
    clearDateText: { color: '#5C8AF0', fontSize: 11, fontWeight: '700' },
    calendarBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 15 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    activeDateRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
    activeDateLabel: { color: '#5C8AF0', fontSize: 12, fontWeight: '700', marginRight: 8 },
    activeDateText: { color: '#111827', fontSize: 12, fontWeight: '700' },

    filterWrapper: { paddingLeft: 20, marginBottom: 15 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EEF2F6', marginRight: 10, backgroundColor: '#fff' },
    activeFilterChip: { backgroundColor: '#5C8AF0', borderColor: '#5C8AF0' },
    filterText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
    activeFilterText: { color: '#fff' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    refText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },

    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: 'bold' },

    serviceText: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    infoText: { fontSize: 13, color: '#6B7280', marginBottom: 2 },

    divider: { height: 1, backgroundColor: '#EEF2F6', marginVertical: 12 },

    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeText: { fontSize: 12, color: '#A0A0A0' },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    assignSmallBtn: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    assignSmallBtnText: { color: '#5C8AF0', fontSize: 11, fontWeight: '700' },
    detailsBtn: { flexDirection: 'row', alignItems: 'center' },
    detailsBtnText: { color: '#5C8AF0', fontSize: 13, fontWeight: 'bold', marginRight: 4 }
});
