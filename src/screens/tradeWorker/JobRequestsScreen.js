import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function JobRequestsScreen({ navigation }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'bookings'), where('status', 'in', ['Pending', 'Request Sent']));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setRequests(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const renderItem = ({ item, index }) => {
        // Just alternating mock names/ids for aesthetic match with your design if empty
        const mockName = item.taskDescription ? "Nimal Perera" : "Amara Fernando";
        const isUrgent = index === 0;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.jobId}>#{item.id.substring(0, 8).toUpperCase()} • 10 min ago</Text>
                    {isUrgent ? (
                        <View style={styles.urgentPill}><Text style={styles.urgentPillText}>● Urgent / Pending</Text></View>
                    ) : (
                        <View style={styles.newPill}><Text style={styles.newPillText}>● New</Text></View>
                    )}
                </View>

                <Text style={styles.jobTitle} numberOfLines={1}>{item.taskDescription || 'Wiring Repair & Short Circuit'}</Text>

                <View style={styles.userRow}>
                    <Text style={styles.userName}>{mockName} • </Text>
                    <Ionicons name="location-outline" size={14} color="#2C64E3" />
                    <Text style={styles.distanceText}> 2.4 km away</Text>
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.budgetLabel}>Estimated Budget</Text>
                        <Text style={styles.budgetValue}>Rs. {item.total === 'TBD' ? '3,500' : (item.total || '3,500')}</Text>
                    </View>
                    <TouchableOpacity style={styles.detailsBtn} onPress={() => navigation.navigate('JobDetails', { job: item })}>
                        <Text style={styles.detailsBtnText}>View Details →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Job Requests</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="options-outline" size={20} color="#111827" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="notifications-outline" size={20} color="#111827" /></TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput placeholder="Search job requests..." placeholderTextColor="#A0A0A0" style={styles.searchInput} />
            </View>

            <View style={styles.statusRow}>
                <Text style={styles.statusText}>Showing <Text style={{ fontWeight: 'bold', color: '#111827' }}>{requests.length} Pending</Text> requests</Text>
                <Text style={styles.liveUpdateText}>↻ Auto-updates live</Text>
            </View>

            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity style={styles.activeFilterPill}><Text style={styles.activeFilterText}>All Services ∨</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.filterPill}><Text style={styles.filterText}>Electrical</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.filterPill}><Text style={styles.filterText}>Plumbing</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.filterPill}><Text style={styles.filterText}>Carpentry</Text></TouchableOpacity>
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2C64E3" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 15 },
    headerRight: { flexDirection: 'row' },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginLeft: 10, borderWidth: 1, borderColor: '#EEF2F6' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 15 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
    statusText: { fontSize: 13, color: '#6B7280' },
    liveUpdateText: { fontSize: 13, color: '#5C8AF0', fontWeight: '600' },

    filterWrapper: { marginBottom: 15 },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    activeFilterPill: { backgroundColor: '#5C8AF0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    activeFilterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    filterPill: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EEF2F6' },
    filterText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    jobId: { fontSize: 12, color: '#888', fontWeight: '600' },
    urgentPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    urgentPillText: { color: '#EA580C', fontSize: 10, fontWeight: 'bold' },
    newPill: { backgroundColor: '#EDF2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    newPillText: { color: '#2C64E3', fontSize: 10, fontWeight: 'bold' },

    jobTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    userName: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
    distanceText: { fontSize: 13, color: '#6B7280' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 },
    budgetLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
    budgetValue: { fontSize: 18, fontWeight: '900', color: '#111827' },

    detailsBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
    detailsBtnText: { color: '#2C64E3', fontSize: 13, fontWeight: 'bold' }
});

