import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function JobDetailsScreen({ route, navigation }) {
    const { job } = route.params;
    const [loading, setLoading] = useState(false);

    // Update Firestore booking status
    const handleJobAction = async (newStatus) => {
        setLoading(true);
        try {
            const jobRef = doc(db, 'bookings', job.id);
            await updateDoc(jobRef, {
                status: newStatus,
                updatedAt: new Date()
            });

            Alert.alert("Success", `Job has been ${newStatus === 'Rejected' ? 'rejected' : 'accepted'}.`, [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            setLoading(false);
            Alert.alert("Error", error.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 15 }}>
                        <Text style={styles.headerTitle}>Job Details</Text>
                        <Text style={styles.headerSub}>#{job.id.substring(0, 8).toUpperCase()} • Electrical</Text>
                    </View>
                </View>
                <View style={styles.pendingPill}><Text style={styles.pendingText}>● Pending</Text></View>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Customer Card */}
                <View style={styles.card}>
                    <View style={styles.customerTop}>
                        <View style={styles.customerAvatar}>
                            <Ionicons name="person" size={24} color="#A0A0A0" />
                            <View style={styles.onlineDot} />
                        </View>
                        <View style={styles.customerInfo}>
                            <Text style={styles.customerName}>Nimal Perera</Text>
                            <Text style={styles.customerPhone}>📱 +94 77 123 4567</Text>
                        </View>
                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingNum}>⭐ 4.9</Text>
                            <Text style={styles.reviewCount}>14 reviews</Text>
                        </View>
                    </View>
                    <View style={styles.contactRow}>
                        <TouchableOpacity style={styles.contactBtn}>
                            <Ionicons name="call-outline" size={18} color="#5C8AF0" style={{ marginRight: 8 }} />
                            <Text style={styles.contactBtnText}>Call Customer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactBtn}>
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#5C8AF0" style={{ marginRight: 8 }} />
                            <Text style={styles.contactBtnText}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Problem Description */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="flash" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                            <Text style={styles.cardTitle}>Problem Description</Text>
                        </View>
                        <Text style={styles.urgentRed}>Urgent</Text>
                    </View>
                    <Text style={styles.descText}>
                        “{job.taskDescription || 'Living room main socket is sparking heavily whenever AC is turned on. Needs urgent inspection and replacement.'}”
                    </Text>
                    <Text style={styles.timeText}>🕒 Submitted Today, 2:15 PM</Text>
                </View>

                {/* Service Location */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="location-outline" size={18} color="#5C8AF0" style={{ marginRight: 8 }} />
                            <Text style={styles.cardTitle}>Service Location</Text>
                        </View>
                        <Text style={styles.locationCity}>Colombo 03</Text>
                    </View>
                    <View style={styles.mapPlaceholder}>
                        <Ionicons name="map-outline" size={40} color="#A0A0A0" />
                    </View>
                    <View style={styles.addressRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.addressBold}>No. 42, Galle Road, Colombo 03</Text>
                            <Text style={styles.distanceInfo}>◬ 2.4 km (8 mins drive)</Text>
                        </View>
                        <TouchableOpacity style={styles.directionsBtn}>
                            <Text style={styles.directionsText}>Get Directions ↗</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Estimated Payout */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="cash-outline" size={18} color="#10B981" style={{ marginRight: 8 }} />
                            <Text style={styles.cardTitle}>Estimated Payout</Text>
                        </View>
                        <View style={styles.standardPill}><Text style={styles.standardText}>Standard Rate</Text></View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 }}>
                        <Text style={styles.payoutValue}>Rs. {job.total === 'TBD' ? '3,500' : (job.total || '3,500')}</Text>
                        <Text style={styles.payoutSub}> (Labor + Inspection)</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={16} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={styles.infoText}>Parts billed separately if required. Customer agrees to instant digital approval.</Text>
                    </View>
                </View>

                {/* Technician Checklist */}
                <View style={[styles.card, { marginBottom: 100 }]}>
                    <Text style={styles.cardTitle}>Technician Checklist</Text>
                    <View style={styles.checkItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#5C8AF0" style={{ marginRight: 10 }} />
                        <Text style={styles.checkText}>Multimeter & insulated screwdrivers ready</Text>
                    </View>
                    <View style={styles.checkItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#5C8AF0" style={{ marginRight: 10 }} />
                        <Text style={styles.checkText}>13A / 15A Socket replacement unit in kit</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions Fixed */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleJobAction('Rejected')}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.rejectText}>Reject Request</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleJobAction('In Progress')}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptText}>Accept Job ✓</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6B7280' },
    pendingPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#FFEDD5' },
    pendingText: { color: '#F59E0B', fontSize: 12, fontWeight: 'bold' },

    container: { paddingHorizontal: 20, paddingTop: 10 },

    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },

    // Customer
    customerTop: { flexDirection: 'row', marginBottom: 20 },
    customerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },
    customerInfo: { flex: 1, justifyContent: 'center' },
    customerName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    customerPhone: { fontSize: 13, color: '#6B7280' },
    ratingBox: { alignItems: 'flex-end', justifyContent: 'center' },
    ratingNum: { fontSize: 14, fontWeight: 'bold', color: '#F59E0B' },
    reviewCount: { fontSize: 11, color: '#888' },
    contactRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EDF2FE' },
    contactBtnText: { color: '#5C8AF0', fontWeight: 'bold', fontSize: 14 },

    // Description
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
    urgentRed: { color: '#EF4444', fontSize: 12, fontWeight: 'bold', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    descText: { fontSize: 15, color: '#111827', lineHeight: 24, marginBottom: 15 },
    timeText: { fontSize: 12, color: '#888' },

    // Map
    locationCity: { fontSize: 13, color: '#6B7280' },
    mapPlaceholder: { height: 120, backgroundColor: '#E5E7EB', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    addressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addressBold: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    distanceInfo: { fontSize: 12, color: '#10B981' },
    directionsBtn: { borderWidth: 1, borderColor: '#EDF2FE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    directionsText: { color: '#5C8AF0', fontSize: 12, fontWeight: 'bold' },

    // Payout
    standardPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    standardText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
    payoutValue: { fontSize: 24, fontWeight: '900', color: '#111827' },
    payoutSub: { fontSize: 14, color: '#6B7280' },
    infoBox: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, color: '#4B5563', lineHeight: 18 },

    // Checklist
    checkItem: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
    checkText: { fontSize: 14, color: '#4B5563' },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#EEF2F6', gap: 15, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5 },
    rejectBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center' },
    rejectText: { color: '#EF4444', fontWeight: 'bold', fontSize: 15 },
    acceptBtn: { flex: 1.5, backgroundColor: '#5C8AF0', paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

