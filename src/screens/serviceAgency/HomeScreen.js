import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>SL</Text>
                    </View>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back</Text>
                        <Text style={styles.agencyName}>QuickFix Sri Lanka</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.bellBtn}>
                    <Ionicons name="notifications-outline" size={24} color="#111827" />
                    <View style={styles.bellDot} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Card 1 */}
                    <View style={styles.statCard}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#F59E0B' }]}>Pending</Text>
                        </View>
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Pending Bookings</Text>
                    </View>

                    {/* Card 2 */}
                    <View style={styles.statCard}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="time-outline" size={20} color="#5C8AF0" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#5C8AF0' }]}>Active</Text>
                        </View>
                        <Text style={styles.statValue}>24</Text>
                        <Text style={styles.statLabel}>Active Jobs</Text>
                    </View>

                    {/* Card 3 */}
                    <View style={styles.statCard}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="people-outline" size={20} color="#10B981" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#10B981' }]}>Staff</Text>
                        </View>
                        <Text style={styles.statValue}>18</Text>
                        <Text style={styles.statLabel}>Registered Workers</Text>
                    </View>

                    {/* Card 4 */}
                    <View style={styles.statCard}>
                        <View style={styles.statTop}>
                            <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.statStatus, { color: '#EF4444' }]}>Urgent</Text>
                        </View>
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>Complaints</Text>
                    </View>
                </View>

                {/* Recent Bookings */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Bookings</Text>
                    <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
                </View>

                <View style={styles.bookingCard}>
                    <View style={styles.bookingLeft}>
                        <View style={styles.bookingIconBox}>
                            <Ionicons name="flash-outline" size={20} color="#5C8AF0" />
                        </View>
                        <View>
                            <Text style={styles.bookingName}>Dinesh Perera</Text>
                            <Text style={styles.bookingSub}>Electrical • Colombo 03</Text>
                        </View>
                    </View>
                    <View style={styles.bookingRight}>
                        <View style={styles.pendingPill}><Text style={styles.pendingPillText}>Pending</Text></View>
                        <Text style={styles.bookingTime}>10:30 AM</Text>
                    </View>
                </View>

                <View style={styles.bookingCard}>
                    <View style={styles.bookingLeft}>
                        <View style={styles.bookingIconBox}>
                            <Ionicons name="water-outline" size={20} color="#5C8AF0" />
                        </View>
                        <View>
                            <Text style={styles.bookingName}>Anura Silva</Text>
                            <Text style={styles.bookingSub}>Plumbing • Kandy</Text>
                        </View>
                    </View>
                    <View style={styles.bookingRight}>
                        <View style={styles.confirmedPill}><Text style={styles.confirmedPillText}>Confirmed</Text></View>
                        <Text style={styles.bookingTime}>02:15 PM</Text>
                    </View>
                </View>

                {/* Worker Availability */}
                <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 15 }]}>Worker Availability</Text>

                <View style={styles.workerGrid}>
                    <View style={styles.workerCard}>
                        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                        <View>
                            <Text style={styles.workerName}>Kamal Fernando</Text>
                            <Text style={styles.workerStatus}>Available</Text>
                        </View>
                    </View>

                    <View style={styles.workerCard}>
                        <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                        <View>
                            <Text style={styles.workerName}>Ruwan Silva</Text>
                            <Text style={styles.workerStatus}>On Job</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.addWorkerBtn} onPress={() => navigation.navigate('NewJobAssignment')}>
                        <Ionicons name="person-add-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                        <Text style={styles.addWorkerText}>Add Worker</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.assignJobBtn}>
                        <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.assignJobText}>Assign Job</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#EEF2FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#5C8AF0', fontSize: 16, fontWeight: 'bold' },
    welcomeText: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    agencyName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },

    bellBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center' },
    bellDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#fff' },

    container: { paddingHorizontal: 20, paddingBottom: 30 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15, marginBottom: 20 },
    statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
    statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 5 },
    statValue: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#6B7280' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    viewAllText: { fontSize: 13, color: '#5C8AF0', fontWeight: 'bold' },

    bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    bookingLeft: { flexDirection: 'row', alignItems: 'center' },
    bookingIconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    bookingName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    bookingSub: { fontSize: 12, color: '#6B7280' },
    bookingRight: { alignItems: 'flex-end' },
    pendingPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 5 },
    pendingPillText: { color: '#F59E0B', fontSize: 10, fontWeight: 'bold' },
    confirmedPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 5 },
    confirmedPillText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
    bookingTime: { fontSize: 11, color: '#A0A0A0' },

    workerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    workerCard: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    workerName: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    workerStatus: { fontSize: 11, color: '#6B7280' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    addWorkerBtn: { width: '48%', flexDirection: 'row', height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#6B7280', justifyContent: 'center', alignItems: 'center' },
    addWorkerText: { color: '#6B7280', fontSize: 14, fontWeight: 'bold' },
    assignJobBtn: { width: '48%', flexDirection: 'row', height: 50, borderRadius: 12, backgroundColor: '#5C8AF0', justifyContent: 'center', alignItems: 'center' },
    assignJobText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
