import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { deleteWorker, getAgencyWorkers, getWorkersBusyToday } from './agencyService';

const filters = ['All Workers', 'Available', 'Busy', 'Inactive'];

const normalizeWorkerStatusFilter = (rawFilter) => {
    if (!rawFilter) return 'All Workers';
    const normalized = String(rawFilter).trim();
    if (normalized === 'Active') return 'Available';
    if (normalized === 'On Job') return 'Busy';
    return filters.includes(normalized) ? normalized : 'All Workers';
};

export default function WorkersScreen({ navigation, route }) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Workers');
    const [busyWorkerIds, setBusyWorkerIds] = useState(new Set());

    const loadWorkers = useCallback(async () => {
        try {
            const [list, nextBusyWorkerIds] = await Promise.all([getAgencyWorkers(), getWorkersBusyToday()]);
            const sortedList = [...list].sort((a, b) => {
                const aTime = a.createdAt?.seconds ?? a.createdAt ?? 0;
                const bTime = b.createdAt?.seconds ?? b.createdAt ?? 0;
                return Number(bTime) - Number(aTime);
            });
            setWorkers(sortedList);
            setBusyWorkerIds(nextBusyWorkerIds);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load workers.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const nextFilter = normalizeWorkerStatusFilter(route?.params?.filter);
        setActiveFilter(nextFilter);
    }, [route?.params?.filter]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadWorkers();
        }, [loadWorkers])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadWorkers();
    };

    const filteredWorkers = workers.filter((worker) => {
        const name = (worker.fullName || worker.name || '').toLowerCase();
        const skill = (worker.workerType || worker.trade || worker.department || '').toLowerCase();
        const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || skill.includes(searchQuery.toLowerCase());
        const availability = worker.status === 'Inactive'
            ? 'Inactive'
            : busyWorkerIds.has(worker.id)
                ? 'Busy'
                : 'Available';

        if (activeFilter === 'All Workers') return matchesSearch;
        if (activeFilter === 'Available') return matchesSearch && availability === 'Available';
        if (activeFilter === 'Busy') return matchesSearch && availability === 'Busy';
        if (activeFilter === 'Inactive') return matchesSearch && availability === 'Inactive';

        return matchesSearch;
    });

    const handleDeleteWorker = (worker) => {
        Alert.alert(
            'Delete worker',
            `Are you sure you want to delete ${worker.fullName || worker.name || 'this worker'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteWorker(worker.id);
                            await loadWorkers();
                            Alert.alert('Success', 'Worker deleted successfully.');
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Could not delete worker.');
                        }
                    },
                },
            ]
        );
    };

    const renderWorker = ({ item }) => {
        const displayName = item.fullName || item.name || 'Unnamed Worker';
        const initials = displayName
            .split(' ')
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
        const availability = item.status === 'Inactive'
            ? 'Inactive'
            : busyWorkerIds.has(item.id)
                ? 'Busy'
                : 'Available';
        const availabilityStyle = availability === 'Inactive'
            ? styles.inactiveChip
            : availability === 'Busy'
                ? styles.busyChip
                : styles.availableChip;

        return (
            <View style={styles.workerCard}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.workerContent}
                    onPress={() => navigation.navigate('WorkerProfile', { workerId: item.id })}
                >
                    <View style={styles.workerLeft}>
                        <View style={styles.avatarPlaceholder}>
                            {item.photoURL ? (
                                <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            )}
                        </View>
                        <View style={styles.workerInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.workerName}>{displayName}</Text>
                                <View style={[styles.statusChip, availabilityStyle]}>
                                    <Text style={[styles.statusChipText, availability === 'Busy' && styles.busyChipText, availability === 'Inactive' && styles.inactiveChipText]}>{availability}</Text>
                                </View>
                            </View>
                            <View style={styles.tradeRow}>
                                <Text style={styles.workerTrade}>{item.workerType || item.trade || item.department || 'General Worker'}</Text>
                            </View>
                            <Text style={styles.workerLocation}>{item.location || 'Unspecified Location'}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.actionIcons}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => navigation.navigate('AddWorker', { worker: item })}
                    >
                        <Ionicons name="create-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteWorker(item)}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <View style={styles.header}>
                <Text style={styles.largeTitle}>Workers</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search name or skill"
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

            {loading ? (
                <ActivityIndicator size="large" color="#5C8AF0" style={{ marginTop: 30 }} />
            ) : (
                <FlatList
                    data={filteredWorkers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderWorker}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5C8AF0']} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No workers found.</Text>}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddWorker')}
                accessibilityRole="button"
                accessibilityLabel="Add worker"
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
    backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    largeTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 15 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#111827' },

    filterWrapper: { paddingLeft: 20, marginBottom: 20 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EEF2F6', marginRight: 10, backgroundColor: '#fff' },
    activeFilterChip: { backgroundColor: '#F0F4FF', borderColor: '#F0F4FF' },
    filterText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
    activeFilterText: { color: '#5C8AF0' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 90 },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20 },

    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#5C8AF0', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#111827', shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },

    workerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4 },
    workerContent: { flex: 1 },
    workerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
    avatarImage: { width: 50, height: 50, borderRadius: 25 },
    avatarInitials: { fontSize: 14, fontWeight: '800', color: '#111827' },
    workerInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    workerName: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginRight: 8 },
    statusChip: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
    availableChip: { backgroundColor: '#ECFDF5' },
    busyChip: { backgroundColor: '#FFF7ED' },
    inactiveChip: { backgroundColor: '#F3F4F6' },
    statusChipText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
    busyChipText: { color: '#F59E0B' },
    inactiveChipText: { color: '#6B7280' },
    tradeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    workerTrade: { fontSize: 13, color: '#6B7280' },
    workerRating: { fontSize: 13, color: '#111827', fontWeight: 'bold' },
    workerLocation: { fontSize: 12, color: '#A0A0A0' },

    actionIcons: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center' }
});
