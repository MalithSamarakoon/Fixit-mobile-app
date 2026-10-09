import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function WorkersScreen({ navigation }) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Trades');

    const filters = ['All Trades', 'Electrician', 'Plumber', 'Available'];

    // Read workers from Firestore
    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'worker'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            setWorkers(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const renderWorker = ({ item }) => (
        <View style={styles.workerCard}>
            <View style={styles.workerLeft}>
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#A0A0A0" />
                </View>
                <View style={styles.workerInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.workerName}>{item.name || item.fullName || 'Unnamed Worker'}</Text>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: item.status === 'Available' ? '#10B981' : '#F59E0B' }
                        ]} />
                    </View>
                    <View style={styles.tradeRow}>
                        <Text style={styles.workerTrade}>{item.trade || item.department || 'General Worker'}  •  </Text>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.workerRating}> {item.rating || '4.8'}</Text>
                    </View>
                    <Text style={styles.workerLocation}>{item.location || 'Unspecified Location'}</Text>
                </View>
            </View>
            <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="eye-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top Bar with Back Button */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.largeTitle}>Workers</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddWorker')}>
                    <Ionicons name="add" size={18} color="#111827" />
                    <Text style={styles.addBtnText}>Add Worker</Text>
                </TouchableOpacity>
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
            </View>

            {/* Filters */}
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
                <ActivityIndicator size="large" color="#5C8AF0" style={{ marginTop: 30 }} />
            ) : (
                <FlatList
                    data={workers}
                    keyExtractor={item => item.id}
                    renderItem={renderWorker}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyText}>No workers found.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
    backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    largeTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    addBtn: { flexDirection: 'row', backgroundColor: '#8CA8F9', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    addBtnText: { color: '#111827', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 15 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#111827' },

    filterWrapper: { paddingLeft: 20, marginBottom: 20 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EEF2F6', marginRight: 10, backgroundColor: '#fff' },
    activeFilterChip: { backgroundColor: '#F0F4FF', borderColor: '#F0F4FF' },
    filterText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
    activeFilterText: { color: '#5C8AF0' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20 },

    workerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4 },
    workerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    workerInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    workerName: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginRight: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    tradeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    workerTrade: { fontSize: 13, color: '#6B7280' },
    workerRating: { fontSize: 13, color: '#111827', fontWeight: 'bold' },
    workerLocation: { fontSize: 12, color: '#A0A0A0' },

    actionIcons: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center' }
});
