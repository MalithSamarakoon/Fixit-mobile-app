import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen({ navigation }) {
    const [workerData, setWorkerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const fetchWorkerData = async () => {
            try {
                const uid = auth.currentUser?.uid;
                if (!uid) return;
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) setWorkerData(userDoc.data());
            } catch (error) {
                console.error("Error fetching worker data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkerData();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.logoText}>Fix It</Text>
                    <Text style={styles.portalText}>WORKER PORTAL</Text>
                </View>
                <TouchableOpacity style={styles.bellBtn}>
                    <Ionicons name="notifications-outline" size={24} color="#2C64E3" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {loading ? (
                        <ActivityIndicator color="#2C64E3" />
                    ) : (
                        <>
                            <View style={styles.profileRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>KS</Text>
                                    <View style={styles.onlineDotProfile} />
                                </View>
                                <View style={styles.profileInfo}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.name}>{workerData?.username || 'Kamal Silva'}</Text>
                                        <Ionicons name="checkmark-circle" color="#2C64E3" size={16} style={{ marginLeft: 5 }} />
                                    </View>
                                    <Text style={styles.roleText}>{workerData?.serviceType || 'Certified Electrician'}</Text>
                                    <Text style={styles.ratingText}>⭐ 4.9 <Text style={styles.jobsCompleted}>(48 jobs completed)</Text></Text>
                                </View>
                            </View>
                            <View style={styles.availabilityRow}>
                                <View style={styles.availTextRow}>
                                    <View style={styles.availDot} />
                                    <View>
                                        <Text style={styles.availTitle}>Work Availability</Text>
                                        <Text style={styles.availSub}>Available for new jobs</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={isOnline}
                                    onValueChange={setIsOnline}
                                    trackColor={{ false: "#E5E7EB", true: "#4A7DF0" }}
                                    thumbColor={"#fff"}
                                />
                            </View>
                        </>
                    )}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Requests</Text>
                        <Text style={styles.statValueBlue}>3</Text>
                        <View style={styles.greenPill}><Text style={styles.greenPillText}>+2 new</Text></View>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Jobs Today</Text>
                        <Text style={styles.statValueDark}>2</Text>
                        <Text style={styles.statSubText}>1 completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Rating</Text>
                        <Text style={styles.statValueDark}>4.8</Text>
                        <View style={styles.yellowPill}><Text style={styles.yellowPillText}>⭐ Top rated</Text></View>
                    </View>
                </View>

                {/* Quick Navigation Section */}
                <View style={styles.navHeaderRow}>
                    <Text style={styles.navHeaderTitle}>QUICK NAVIGATION</Text>
                    <TouchableOpacity><Text style={styles.navHeaderLink}>View All</Text></TouchableOpacity>
                </View>

                {/* Job Requests Card */}
                <View style={styles.navCard}>
                    <View style={styles.navCardTopRow}>
                        <View style={styles.navIconBox}><Ionicons name="clipboard-outline" size={24} color="#2C64E3" /></View>
                        <View style={styles.navInfo}>
                            <Text style={styles.navCardTitle}>Incoming Job Requests</Text>
                            <Text style={styles.navCardSub}>Respond within 15 minutes</Text>
                        </View>
                        <View style={styles.bluePill}><Text style={styles.bluePillText}>3 Pending</Text></View>
                    </View>
                    <TouchableOpacity style={styles.blueButton} onPress={() => navigation.navigate('JobRequests')}>
                        <Text style={styles.blueButtonText}>View Job Requests →</Text>
                    </TouchableOpacity>
                </View>

                {/* Calendar Card */}
                <View style={styles.navCard}>
                    <View style={styles.navCardTopRow}>
                        <View style={styles.navIconBox}><Ionicons name="calendar-outline" size={24} color="#2C64E3" /></View>
                        <View style={styles.navInfo}>
                            <Text style={styles.navCardTitle}>My Schedule & Calendar</Text>
                            <Text style={styles.navCardSub}>Next: Wed, 23 Sep • 9:00 AM (Wiring Repair)</Text>
                        </View>
                        <Text style={styles.linkText}>Today</Text>
                    </View>
                    <TouchableOpacity style={styles.whiteButton} onPress={() => navigation.navigate('Calendar')}>
                        <Text style={styles.whiteButtonText}>Open Calendar & Schedule →</Text>
                    </TouchableOpacity>
                </View>

                {/* Earnings Card */}
                <View style={styles.navCard}>
                    <View style={styles.navCardTopRow}>
                        <View style={styles.navIconBox}><Ionicons name="wallet-outline" size={24} color="#2C64E3" /></View>
                        <View style={styles.navInfo}>
                            <Text style={styles.navCardTitle}>Earnings & Payouts</Text>
                            <Text style={styles.navCardSub}>Rs. 48,500 This Month</Text>
                        </View>
                        <Text style={styles.greenText}>Weekly Payout</Text>
                    </View>
                    <TouchableOpacity style={styles.whiteButton} onPress={() => navigation.navigate('Earnings')}>
                        <Text style={styles.whiteButtonText}>View Earnings & History →</Text>
                    </TouchableOpacity>
                </View>

                {/* Offline Button */}
                <TouchableOpacity style={styles.offlineButton}>
                    <Ionicons name="power-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text style={styles.offlineText}>Go Offline</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15 },
    logoText: { fontSize: 24, fontWeight: '900', color: '#5C8AF0' },
    portalText: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', letterSpacing: 1 },
    bellBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#EDF2FE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D9E4FA' },

    container: { paddingHorizontal: 20, paddingBottom: 30 },

    profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatar: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#2C64E3' },
    onlineDotProfile: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },
    profileInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    name: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    roleText: { color: '#2C64E3', fontSize: 13, fontWeight: '600', marginTop: 2, marginBottom: 4 },
    ratingText: { fontSize: 13, color: '#F59E0B', fontWeight: 'bold' },
    jobsCompleted: { color: '#6B7280', fontWeight: 'normal' },

    availabilityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    availTextRow: { flexDirection: 'row', alignItems: 'center' },
    availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 10 },
    availTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    availSub: { fontSize: 12, color: '#6B7280' },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F6', marginHorizontal: 4 },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 5 },
    statValueBlue: { fontSize: 24, fontWeight: '900', color: '#2C64E3', marginBottom: 5 },
    statValueDark: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 5 },
    greenPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    greenPillText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
    yellowPill: { backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    yellowPillText: { color: '#F59E0B', fontSize: 10, fontWeight: 'bold' },
    statSubText: { fontSize: 10, color: '#6B7280' },

    navHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    navHeaderTitle: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', letterSpacing: 1 },
    navHeaderLink: { fontSize: 13, color: '#2C64E3', fontWeight: '600' },

    navCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    navCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
    navIconBox: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    navInfo: { flex: 1 },
    navCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    navCardSub: { fontSize: 12, color: '#6B7280' },
    bluePill: { backgroundColor: '#5C8AF0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    bluePillText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    linkText: { color: '#2C64E3', fontSize: 12, fontWeight: 'bold' },
    greenText: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },

    blueButton: { backgroundColor: '#5C8AF0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    blueButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    whiteButton: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F6' },
    whiteButtonText: { color: '#111827', fontSize: 14, fontWeight: 'bold' },

    offlineButton: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF2F6', marginTop: 5 },
    offlineText: { color: '#6B7280', fontSize: 15, fontWeight: '600' }
});


