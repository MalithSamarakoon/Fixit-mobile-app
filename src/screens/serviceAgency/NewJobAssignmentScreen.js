import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function NewJobAssignmentScreen({ navigation }) {
    // Initializing with dummy data for UI display purposes based on your screenshot
    const [customerName, setCustomerName] = useState('Harsha Wijesinghe');
    const [phone, setPhone] = useState('+94 77 123 4567');
    const [serviceType, setServiceType] = useState('Electrician');
    const [description, setDescription] = useState('Water leakage in kitchen pantry triggered main circuit b...');
    const [address, setAddress] = useState('72/A, Park Road, Colombo 05');
    const [date, setDate] = useState('Today, Jan 19');
    const [time, setTime] = useState('10:30 AM');
    const [cost, setCost] = useState('LKR 4,500');

    // For a real app, this would be a selectable state from a modal or picker
    const [assignedWorker, setAssignedWorker] = useState('Priyantha Perera');

    const [loading, setLoading] = useState(false);

    const handleAssignJob = async () => {
        if (!customerName || !serviceType || !address || !date || !time) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        }

        setLoading(true);
        try {
            // Write the new assigned booking to Firestore
            await addDoc(collection(db, 'bookings'), {
                customerName,
                customerPhone: phone,
                serviceType,
                problemDescription: description,
                address,
                preferredDate: date,
                preferredTime: time,
                estimatedCost: cost,
                assignedWorkerName: assignedWorker,
                status: 'Assigned', // Sets the job status as Assigned
                createdAt: serverTimestamp()
            });

            Alert.alert('Success', 'Job assigned successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Job Assignment</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Main Blue Card */}
                <View style={styles.blueCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Create Assignment</Text>
                        <View style={styles.draftBadge}>
                            <Text style={styles.draftText}>Draft</Text>
                        </View>
                    </View>

                    {/* Form Fields */}
                    <Text style={styles.label}>Customer Name</Text>
                    <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} />

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

                    <Text style={styles.label}>Service Type Required</Text>
                    <View style={styles.inputDropdown}>
                        <TextInput style={styles.inputFlex} value={serviceType} onChangeText={setServiceType} />
                        <Ionicons name="chevron-down" size={20} color="#111827" style={styles.dropdownIcon} />
                    </View>

                    <Text style={styles.label}>Problem Description</Text>
                    <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={description} onChangeText={setDescription} />

                    <Text style={styles.label}>Service Address</Text>
                    <View style={styles.inputWithIcon}>
                        <Ionicons name="location-outline" size={20} color="#EF4444" style={styles.inputLeftIcon} />
                        <TextInput style={styles.inputFlex} value={address} onChangeText={setAddress} />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Preferred Date</Text>
                            <View style={styles.inputWithIcon}>
                                <Ionicons name="calendar-outline" size={18} color="#6B7280" style={styles.inputLeftIcon} />
                                <TextInput style={styles.inputFlex} value={date} onChangeText={setDate} />
                            </View>
                        </View>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Preferred Time</Text>
                            <View style={styles.inputWithIcon}>
                                <Ionicons name="time-outline" size={18} color="#6B7280" style={styles.inputLeftIcon} />
                                <TextInput style={styles.inputFlex} value={time} onChangeText={setTime} />
                            </View>
                        </View>
                    </View>

                    <Text style={styles.label}>Estimated Cost (LKR)</Text>
                    <TextInput style={[styles.input, styles.boldInput]} value={cost} onChangeText={setCost} />

                    <Text style={styles.label}>Assigned Expert Specialist</Text>
                    <TouchableOpacity style={styles.workerDropdown}>
                        <View style={styles.workerDropLeft}>
                            <View style={styles.workerAvatar}>
                                <Ionicons name="person" size={18} color="#A0A0A0" />
                            </View>
                            <View>
                                <View style={styles.workerNameRow}>
                                    <Text style={styles.workerName}>{assignedWorker}</Text>
                                    <View style={styles.statusDot} />
                                </View>
                                <Text style={styles.workerSub}>⭐ 4.9 (8 yrs exp)</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#111827" />
                    </TouchableOpacity>

                    {/* Submit Button Inside Card */}
                    <TouchableOpacity style={styles.assignBtn} onPress={handleAssignJob} disabled={loading}>
                        {loading ? <ActivityIndicator color="#6B8DF2" /> : <Text style={styles.assignBtnText}>Assign Job</Text>}
                    </TouchableOpacity>
                </View>

                {/* Cancel Button Outside Card */}
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelBtnText}>Cancel & Exit</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

    container: { paddingHorizontal: 20, paddingBottom: 40 },

    blueCard: { backgroundColor: '#6C8CF2', borderRadius: 24, padding: 20, marginTop: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    draftBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    draftText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    label: { color: '#E0E7FF', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 15 },

    input: { backgroundColor: '#fff', borderRadius: 12, height: 50, paddingHorizontal: 15, fontSize: 14, color: '#111827' },
    inputFlex: { flex: 1, fontSize: 14, color: '#111827' },

    inputDropdown: { backgroundColor: '#fff', borderRadius: 12, height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    dropdownIcon: { marginLeft: 10 },

    textArea: { height: 80, textAlignVertical: 'top', paddingTop: 15 },

    inputWithIcon: { backgroundColor: '#fff', borderRadius: 12, height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    inputLeftIcon: { marginRight: 10 },

    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfWidth: { width: '48%' },

    boldInput: { fontWeight: 'bold', fontSize: 16 },

    workerDropdown: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    workerDropLeft: { flexDirection: 'row', alignItems: 'center' },
    workerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    workerNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    workerName: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginRight: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    workerSub: { fontSize: 12, color: '#F59E0B', fontWeight: 'bold' },

    assignBtn: { backgroundColor: '#fff', borderRadius: 25, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    assignBtnText: { color: '#6C8CF2', fontSize: 16, fontWeight: 'bold' },

    cancelBtn: { backgroundColor: '#fff', borderRadius: 25, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    cancelBtnText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' }
});
