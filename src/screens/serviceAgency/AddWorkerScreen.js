import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddWorkerScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [rolePosition, setRolePosition] = useState('');
    const [startDate, setStartDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddWorker = async () => {
        if (!fullName || !email || !department || !rolePosition || !startDate) {
            Alert.alert("Error", "Please fill out all required fields.");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'users'), {
                fullName,
                name: fullName,
                email,
                phone,
                department,
                trade: department, // used for filtering/displaying in list
                rolePosition,
                startDate,
                role: 'worker', // Identifies them as a worker in queries
                status: 'Available',
                createdAt: serverTimestamp()
            });
            Alert.alert("Success", "Worker added successfully", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Worker</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Photo Upload */}
                <View style={styles.photoContainer}>
                    <View style={styles.photoCircle}>
                        <Ionicons name="person-outline" size={40} color="#9CA3AF" />
                        <View style={styles.cameraBadge}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.uploadText}>Upload photo</Text>
                </View>

                {/* Personal Details */}
                <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

                <Text style={styles.label}>Full Name <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
                </View>

                <Text style={styles.label}>Email Address <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput style={styles.input} keyboardType="email-address" value={email} onChangeText={setEmail} />
                </View>

                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>

                {/* Employment Details */}
                <Text style={[styles.sectionTitle, { marginTop: 10 }]}>EMPLOYMENT DETAILS</Text>

                <Text style={styles.label}>Department / Team <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="people-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput style={styles.inputFlex} value={department} onChangeText={setDepartment} />
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" style={{ marginRight: 15 }} />
                </View>

                <Text style={styles.label}>Role / Position <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="briefcase-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput style={styles.input} value={rolePosition} onChangeText={setRolePosition} />
                </View>

                <Text style={styles.label}>Start Date <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput style={styles.inputFlex} placeholder="Oct 24, 2026" placeholderTextColor="#111827" value={startDate} onChangeText={setStartDate} />
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" style={{ marginRight: 15 }} />
                </View>

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddWorker} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Worker</Text>}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAFA' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#fff' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

    photoContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    photoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#5C8AF0', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    uploadText: { marginTop: 10, color: '#5C8AF0', fontSize: 14, fontWeight: '600' },

    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 15, marginTop: 10 },
    label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
    asterisk: { color: '#EF4444' },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2F6', borderRadius: 12, height: 52, marginBottom: 20 },
    inputIcon: { marginLeft: 15, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#111827', paddingRight: 15 },
    inputFlex: { flex: 1, fontSize: 15, color: '#111827' },

    submitBtn: { backgroundColor: '#5C8AF0', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
