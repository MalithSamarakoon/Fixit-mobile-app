import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailsScreen({ route, navigation }) {
    // Read passed order or fallback to a dummy if none is provided
    const order = route?.params?.order || { id: '#8492', status: 'Pending', statusBg: '#FFF7ED', statusColor: '#F59E0B' };

    // Local state for UI status updates
    const [status, setStatus] = useState(order.status);
    const [statusBg, setStatusBg] = useState(order.statusBg);
    const [statusColor, setStatusColor] = useState(order.statusColor);

    const updateStatus = (newStatus, bg, color) => {
        setStatus(newStatus);
        setStatusBg(bg);
        setStatusColor(color);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                <View style={styles.orderTitleRow}>
                    <Text style={styles.mainTitle}>Order {order.id}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                    </View>
                </View>

                {/* Customer Info Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Customer Info</Text>
                    <Text style={styles.infoText}>Didula Akash</Text>
                    <Text style={styles.infoTextSub}>0717299789</Text>
                    <Text style={styles.infoTextSub}>DidulaA@example.com</Text>
                </View>

                {/* Order Items Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Order Items</Text>

                    <View style={styles.itemRow}>
                        <Text style={styles.itemText}>1x Heavy Duty Pipe Wrench</Text>
                        <Text style={styles.itemPrice}>Rs 8000.00</Text>
                    </View>
                    <View style={styles.itemRow}>
                        <Text style={styles.itemText}>4x Copper Coupler 1/2"</Text>
                        <Text style={styles.itemPrice}>Rs 3000.00</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Paid</Text>
                        <Text style={styles.totalValue}>Rs 11000.00</Text>
                    </View>
                </View>

                {/* Delivery Location Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Delivery Location</Text>
                    <Text style={styles.infoTextSub}>No 227 /E Kaduwela road, kothalawala</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => updateStatus('Confirmed', '#ECFDF5', '#10B981')}
                    >
                        <Text style={styles.actionBtnText}>Confirm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => updateStatus('Rejected', '#FEF2F2', '#EF4444')}
                    >
                        <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                        onPress={() => updateStatus('In Progress', '#FFF7ED', '#F59E0B')}
                    >
                        <Text style={styles.actionBtnText}>Mark Process</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#5C8AF0' }]}
                        onPress={() => updateStatus('Delivered', '#EDF2FE', '#5C8AF0')}
                    >
                        <Text style={styles.actionBtnText}>Delivered</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

    container: { paddingHorizontal: 20, paddingBottom: 30 },

    orderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: 'bold' },

    card: { backgroundColor: '#F8F9FE', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 15 },

    infoText: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 5 },
    infoTextSub: { fontSize: 14, color: '#6B7280', marginBottom: 3 },

    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    itemText: { fontSize: 14, color: '#4B5563', flex: 1 },
    itemPrice: { fontSize: 14, color: '#111827', fontWeight: 'bold' },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 15 },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    totalValue: { fontSize: 16, fontWeight: '900', color: '#5C8AF0' },

    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
    actionBtn: { width: '48%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
