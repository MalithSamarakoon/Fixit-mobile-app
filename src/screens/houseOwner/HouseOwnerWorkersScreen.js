import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function HouseOwnerWorkersScreen({ navigation }) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Trades');

    const filters = ['All Trades', 'Electrician', 'Plumber', 'Cleaner', 'Painter', 'Available'];

    // Helper for 3-tier status styling
    const getStatusTheme = (status) => {
        switch (status) {
            case 'Available':
                return { color: '#10B981', bg: '#E6F8F0', label: 'Available' };
            case 'On duty':
                return { color: '#2C64E3', bg: '#EDF2FE', label: 'On duty' };
            case 'Not on duty':
                return { color: '#EF4444', bg: '#FEE2E2', label: 'Not on duty' };
            default:
                return { color: '#10B981', bg: '#E6F8F0', label: 'Available' };
        }
    };

    // Real-time Firestore listener for workers
    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            where('role', 'in', ['TradeWorker', 'worker'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            setWorkers(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching workers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter and search logic
    const filteredWorkers = workers.filter((worker) => {
        const name = (worker.name || worker.username || '').toLowerCase();
        const trade = (worker.trade || worker.serviceType || worker.department || '').toLowerCase();
        const location = (worker.location || '').toLowerCase();
        const search = searchQuery.toLowerCase().trim();

        const matchesSearch = !search || name.includes(search) || trade.includes(search) || location.includes(search);

        if (!matchesSearch) return false;

        if (activeFilter === 'All Trades') return true;
        if (activeFilter === 'Available') return (worker.status || 'Available') === 'Available';
        return trade.toLowerCase().includes(activeFilter.toLowerCase());
    });

    const renderWorker = ({ item }) => {
        const statusTheme = getStatusTheme(item.status);
        const displayName = item.name || item.username || item.fullName || 'Unnamed Worker';
        const displayTrade = item.trade || item.serviceType || item.department || 'General Worker';
        const displayLocation = item.location || 'Location Not Specified';
        const displayRating = item.rating ? Number(item.rating).toFixed(1) : '5.0';

        return (
            <TouchableOpacity 
                style={styles.workerCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('WorkerProfile', { worker: item })}
            >
                <View style={styles.workerLeft}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#A0A0A0" />
                    </View>
                    <View style={styles.workerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.workerName}>{displayName}</Text>
                            {/* Live Status Dot */}
                            <View style={[styles.statusDot, { backgroundColor: statusTheme.color }]} />
                        </View>
                        <View style={styles.tradeRow}>
                            <Text style={styles.workerTrade}>{displayTrade}  •  </Text>
                            <Ionicons name="star" size={13} color="#F59E0B" />
                            <Text style={styles.workerRating}> {displayRating}</Text>
                        </View>
                        <Text style={styles.workerLocation}>{displayLocation}</Text>
                    </View>
                </View>

                <View style={styles.actionSection}>
                    {/* Status Pill */}
                    <View style={[styles.statusPill, { backgroundColor: statusTheme.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusTheme.color }]}>
                            {statusTheme.label}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.viewIconBtn} 
                        onPress={() => navigation.navigate('WorkerProfile', { worker: item })}
                    >
                        <Ionicons name="eye-outline" size={20} color="#2C64E3" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.largeTitle}>Workers</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search name or skill..."
                    placeholderTextColor="#A0A0A0"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#A0A0A0" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <View style={styles.filterWrapper}>
                <FlatList
                    horizontal
                    data={filters}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === item && styles.activeFilterChip]}
                            onPress={() => setActiveFilter(item)}
                        >
                            <Text style={[styles.filterText, activeFilter === item && styles.activeFilterText]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Workers List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2C64E3" />
                </View>
            ) : (
                <FlatList
                    data={filteredWorkers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderWorker}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No workers found matching your criteria.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },

    header: { paddingHorizontal: 20, paddingTop: 45, paddingBottom: 15 },
    largeTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },

    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        marginHorizontal: 20, 
        borderRadius: 14, 
        paddingHorizontal: 15, 
        height: 48, 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        marginBottom: 15 
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    filterWrapper: { paddingLeft: 20, marginBottom: 15 },
    filterChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 7, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        marginRight: 10, 
        backgroundColor: '#fff' 
    },
    activeFilterChip: { backgroundColor: '#EDF2FE', borderColor: '#2C64E3' },
    filterText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
    activeFilterText: { color: '#2C64E3' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 12, fontSize: 14 },

    workerCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        borderRadius: 16, 
        padding: 15, 
        marginBottom: 14, 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        elevation: 1, 
        shadowColor: '#000', 
        shadowOpacity: 0.03, 
        shadowRadius: 5 
    },
    workerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarPlaceholder: { 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: '#F3F4F6', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 14 
    },
    workerInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    workerName: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginRight: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    tradeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    workerTrade: { fontSize: 13, color: '#6B7280' },
    workerRating: { fontSize: 13, color: '#111827', fontWeight: 'bold' },
    workerLocation: { fontSize: 12, color: '#9CA3AF' },

    actionSection: { alignItems: 'flex-end', marginLeft: 10 },
    statusPill: { 
        paddingHorizontal: 10, 
        paddingVertical: 3, 
        borderRadius: 10, 
        marginBottom: 8 
    },
    statusPillText: { fontSize: 11, fontWeight: '700' },
    viewIconBtn: { 
        width: 32, 
        height: 32, 
        borderRadius: 8, 
        backgroundColor: '#F0F4FF', 
        justifyContent: 'center', 
        alignItems: 'center' 
    }
});
