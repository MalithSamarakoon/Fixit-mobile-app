import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingsScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'Pending', 'Assigned', 'Completed'];

    // Dummy Bookings Data
    const dummyBookings = [
        { id: 'b1', ref: '#BK-1042', status: 'In Progress', service: 'Plumbing Repair', client: 'Kamal Perera', worker: 'Kasun Silva', time: 'Today, 10:30 AM' },
        { id: 'b2', ref: '#BK-1041', status: 'Completed', service: 'Electrical Wiring', client: 'Nimisha Fernando', worker: 'Priyantha Perera', time: 'Yesterday' },
        { id: 'b3', ref: '#BK-1040', status: 'Assigned', service: 'AC Servicing', client: 'Arjuna Silva', worker: 'Anushka J.', time: 'Tomorrow, 09:00 AM' },
        { id: 'b4', ref: '#BK-1039', status: 'Pending', service: 'Carpentry Fitting', client: 'Ruwan Alwis', worker: 'Unassigned', time: 'Jan 18, 2026' },
        { id: 'b5', ref: '#BK-1038', status: 'Cancelled', service: 'Water Leakage', client: 'Samanthi Cooray', worker: 'Kasun Silva', time: 'Jan 15, 2026' },
        { id: 'b6', ref: '#BK-1037', status: 'Completed', service: 'Painting Interior', client: 'Upul Jayasinghe', worker: 'Nimali Cooray', time: 'Jan 12, 2026' }
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return { bg: '#ECFDF5', text: '#10B981' };
            case 'Assigned': return { bg: '#EEF2FF', text: '#5C8AF0' };
            case 'Cancelled': return { bg: '#FEF2F2', text: '#EF4444' };
            default: return { bg: '#FEF3C7', text: '#D97706' }; // Pending, In Progress
        }
    };

    const filteredBookings = activeFilter === 'All'
        ? dummyBookings
        : dummyBookings.filter(b => b.status === activeFilter || (activeFilter === 'Pending' && b.status === 'In Progress')); // Quick hack to show In Progress under Pending filter

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <Text style={styles.refText}>{item.ref}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                </View>

                <Text style={styles.serviceText}>{item.service}</Text>
                <Text style={styles.infoText}>Client: {item.client}</Text>
                <Text style={styles.infoText}>Worker: {item.worker}</Text>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <TouchableOpacity style={styles.detailsBtn}>
                        <Text style={styles.detailsBtnText}>Details </Text>
                        <Ionicons name="chevron-forward" size={12} color="#5C8AF0" />
                    </TouchableOpacity>
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
                <TouchableOpacity style={styles.calendarBtn}>
                    <Ionicons name="calendar-outline" size={20} color="#111827" />
                </TouchableOpacity>
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

            <FlatList
                data={filteredBookings}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
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
    calendarBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 15 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

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
    detailsBtn: { flexDirection: 'row', alignItems: 'center' },
    detailsBtnText: { color: '#5C8AF0', fontSize: 13, fontWeight: 'bold', marginRight: 4 }
});
