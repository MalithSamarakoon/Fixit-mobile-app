import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AgencyBookingFormScreen({ route, navigation }) {
    const { agency } = route.params;

    const [taskDescription, setTaskDescription] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Please grant photo library access to upload images.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to pick image.");
        }
    };

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
                imageUri: selectedImage || null,
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

                {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                            <Ionicons name="close-circle" size={26} color="#FF4D4D" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.changeImageText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                        <Ionicons name="cloud-upload-outline" size={32} color="#2C64E3" style={{ marginBottom: 5 }} />
                        <Text style={styles.uploadTitle}>Upload images</Text>
                        <Text style={styles.uploadSub}>JPG, PNG up to 10MB</Text>
                    </TouchableOpacity>
                )}

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

    imagePreviewContainer: { 
        height: 160, 
        borderRadius: 16, 
        overflow: 'hidden', 
        marginBottom: 25, 
        position: 'relative', 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        backgroundColor: '#fff' 
    },
    previewImage: { width: '100%', height: '100%' },
    removeImageBtn: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        backgroundColor: '#fff', 
        borderRadius: 13, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOpacity: 0.15, 
        shadowRadius: 3 
    },
    changeImageBtn: { 
        position: 'absolute', 
        bottom: 8, 
        right: 8, 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20 
    },
    changeImageText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    sendButton: { backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
    sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
