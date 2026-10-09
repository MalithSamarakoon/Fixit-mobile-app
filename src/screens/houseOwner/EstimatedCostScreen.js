import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function EstimatedCostScreen({ navigation }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Write to Firestore 'bookings' collection
            const userId = auth.currentUser?.uid || 'anonymous';
            await addDoc(collection(db, 'bookings'), {
                userId,
                status: 'Confirmed',
                serviceCharges: 0,
                hardwareCharges: 0,
                total: 0,
                createdAt: new Date(),
            });

            setLoading(false);
            // Navigate to Tracking
            navigation.navigate('WorkerTracking');
        } catch (error) {
            setLoading(false);
            Alert.alert("Error", error.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Estimated Cost</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.container}>
                {/* Cost Card */}
                <View style={styles.costCard}>
                    <Text style={styles.cardTitle}>Estimated Cost</Text>
                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Service charges</Text>
                        <Text style={styles.rowValue}>0.00</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Hardware charges</Text>
                        <Text style={styles.rowValue}>0.00</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Other charges</Text>
                        <Text style={styles.rowValue}>0.00</Text>
                    </View>

                    <View style={styles.thickDivider} />

                    <View style={styles.row}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>0.00</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Confirm booking</Text>}
                    </TouchableOpacity>

                    {/* Navigates back to Task Description Form to edit data before confirming */}
                    <TouchableOpacity style={styles.editButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.editButtonText}>Edit booking</Text>
                    </TouchableOpacity>

                    {/* Navigates back to Home Tab, completely cancelling the draft */}
                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate('HomeScreen')}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    headerIconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    costCard: { backgroundColor: '#fff', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E2022', textAlign: 'center', marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 20 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    rowLabel: { fontSize: 14, color: '#888' },
    rowValue: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },

    thickDivider: { height: 2, backgroundColor: '#1E2022', marginVertical: 15 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    totalValue: { fontSize: 18, fontWeight: 'bold', color: '#2C64E3' },

    buttonsContainer: { marginTop: 10 },
    confirmButton: { backgroundColor: '#2C64E3', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    editButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2C64E3', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
    editButtonText: { color: '#2C64E3', fontSize: 16, fontWeight: 'bold' },

    cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF4D4D', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    cancelButtonText: { color: '#FF4D4D', fontSize: 16, fontWeight: 'bold' },
});
