import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AgencyBookingFormScreen({ route, navigation }) {
    const { agency } = route.params;

    const [taskDescription, setTaskDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendRequest = async () => {
        if (!taskDescription.trim()) {
            Alert.alert("Required", "Please provide a task description.");
            return;
        }

        setLoading(true);
        try {
            const userId = auth.currentUser?.uid || 'anonymous';

            // Note: Saving targetType = 'agency' so it shows up in Agency dashboards!
            await addDoc(collection(db, 'bookings'), {
                userId,
                agencyId: agency.id,
                agencyName: agency.name,
                targetType: 'agency',
                status: 'Request Sent', // Pending state
                taskDescription,
                total: 'TBD', // Agencies quote prices later
                createdAt: new Date(),
            });

            setLoading(false);
            Alert.alert("Success", `Request sent to ${agency.name}!`, [
                { text: "OK", onPress: () => navigation.navigate('HomeScreen') }
            ]);

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
                <Text style={styles.headerTitle}>Booking Request</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.agencyTitle}>Requesting: {agency.name}</Text>

                <Text style={styles.label}>Task Description</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Describe your job for the agency..."
                    placeholderTextColor="#A0A0A0"
                    multiline
                    textAlignVertical="top"
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                />

                <TouchableOpacity style={styles.uploadBox}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#2C64E3" style={{ marginBottom: 5 }} />
                    <Text style={styles.uploadTitle}>Upload images</Text>
                    <Text style={styles.uploadSub}>JPG, PNG up to 10MB</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sendButton} onPress={handleSendRequest} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send Booking Request</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    headerIconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    container: { paddingHorizontal: 20, paddingBottom: 40 },
    agencyTitle: { fontSize: 18, color: '#2C64E3', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#1E2022', marginBottom: 10 },
    textArea: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 15, height: 120, fontSize: 14, marginBottom: 25 },

    uploadBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    uploadTitle: { color: '#2C64E3', fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
    uploadSub: { color: '#A0A0A0', fontSize: 12 },

    sendButton: { backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
    sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
