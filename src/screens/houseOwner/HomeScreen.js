import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
    // Static worker data
    const workers = [
        { id: 1, name: 'Anura Silva', role: 'Electrician', available: true },
        { id: 2, name: 'Priyantha Perera', role: 'Plumber', available: true },
        { id: 3, name: 'Sahan Nimesh', role: 'Electrician', available: true },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>SL</Text>
                    </View>
                    <View>
                        <Text style={styles.findHelp}>Find Help</Text>
                        <Text style={styles.appName}>FixIt Sri Lanka</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.bellIcon}>
                    <Ionicons name="notifications" size={20} color="#1E2022" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput style={styles.searchInput} placeholder="Search for services..." placeholderTextColor="#A0A0A0" />
            </View>

            {/* Top Cards (Agencies & Hardware) */}
            <View style={styles.cardsRow}>
                <TouchableOpacity style={styles.topCard} onPress={() => navigation.navigate('FindAgencies')}>
                    <View style={[styles.iconWrapper, { backgroundColor: '#F0F4FF' }]}>
                        <Ionicons name="business" size={24} color="#3B66FE" />
                    </View>
                    <Text style={styles.cardTitle}>Find Agencies</Text>
                    <Text style={styles.cardSubtitle}>Professional teams</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.topCard}>
                    <View style={[styles.iconWrapper, { backgroundColor: '#FFF7E6' }]}>
                        <Ionicons name="hardware-chip" size={24} color="#F2A05B" />
                    </View>
                    <Text style={styles.cardTitle}>Hardware Shops</Text>
                    <Text style={styles.cardSubtitle}>Tools & supplies</Text>
                </TouchableOpacity>
            </View>

            {/* Find Workers Section */}
            <Text style={styles.sectionTitle}>Find Workers</Text>

            <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="funnel-outline" size={16} color="#3B66FE" />
                <Text style={styles.filterText}>Filter by service type</Text>
            </TouchableOpacity>

            {/* Worker List */}
            {workers.map(worker => (
                <View key={worker.id} style={styles.workerCard}>
                    <View style={styles.workerAvatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#A0A0A0" />
                    </View>

                    <View style={styles.workerInfo}>
                        <View style={styles.workerHeaderRow}>
                            <Text style={styles.workerName}>{worker.name}</Text>
                            {worker.available && <View style={styles.statusDot} />}
                        </View>

                        <View style={styles.rolePill}>
                            <Text style={styles.roleText}>{worker.role}</Text>
                        </View>

                        {/* Navigate to Profile, passing the worker data */}
                        <TouchableOpacity onPress={() => navigation.navigate('WorkerProfile', { worker })}>
                            <Text style={styles.viewProfileText}>View Profile →</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFBFF', paddingHorizontal: 20, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#EDF2FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#3B66FE', fontWeight: 'bold', fontSize: 16 },
    findHelp: { color: '#888', fontSize: 12 },
    appName: { color: '#1E2022', fontSize: 18, fontWeight: 'bold' },
    bellIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, borderWidth: 1, borderColor: '#3B66FE', paddingHorizontal: 15, height: 50, marginBottom: 25 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14 },

    cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    topCard: { flex: 0.48, backgroundColor: '#fff', borderRadius: 16, padding: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    iconWrapper: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E2022', marginBottom: 4 },
    cardSubtitle: { fontSize: 12, color: '#888' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E2022', marginBottom: 15 },
    filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2FE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, alignSelf: 'flex-start', marginBottom: 20 },
    filterText: { color: '#3B66FE', fontSize: 12, fontWeight: '600', marginLeft: 5 },

    workerCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#3B66FE', padding: 15, marginBottom: 15 },
    workerAvatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    workerInfo: { flex: 1 },
    workerHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    workerName: { fontSize: 16, fontWeight: 'bold', color: '#1E2022', marginRight: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    rolePill: { backgroundColor: '#EDF2FE', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
    roleText: { color: '#3B66FE', fontSize: 12, fontWeight: '600' },
    viewProfileText: { color: '#3B66FE', fontSize: 14, fontWeight: 'bold' }
});
