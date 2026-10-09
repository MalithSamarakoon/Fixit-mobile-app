import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function FeedbackScreen({ navigation }) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Write feedback to Firestore
            const userId = auth.currentUser?.uid || 'anonymous';
            await addDoc(collection(db, 'feedback'), {
                userId,
                rating,
                comment: feedback,
                workerName: 'Anura Silva', // Static for now based on mockup
                createdAt: new Date(),
            });

            setLoading(false);
            setIsSubmitted(true); // Switch to success UI

            // Wait 2 seconds so they can see the success message, then redirect
            setTimeout(() => {
                navigation.navigate('HomeScreen');
            }, 2000);

        } catch (error) {
            setLoading(false);
            Alert.alert("Error", error.message);
        }
    };

    // If the submission was successful, render this Success View instead!
    if (isSubmitted) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={100} color="#10B981" />
                    <Text style={styles.successText}>Feedback submitted</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Default Form View
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" style={{ alignSelf: 'center', marginBottom: 20 }} />
                <Text style={styles.title}>Job Completed!</Text>
                <Text style={styles.subtitle}>Rate your experience with Anura Silva</Text>

                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Ionicons name={rating >= star ? "star" : "star-outline"} size={45} color="#F2A05B" style={{ marginHorizontal: 5 }} />
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={styles.textArea}
                    placeholder="Leave a comment..."
                    placeholderTextColor="#A0A0A0"
                    multiline
                    textAlignVertical="top"
                    value={feedback}
                    onChangeText={setFeedback}
                />

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Feedback</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('HomeScreen')} disabled={loading}>
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },

    // Success View Styles
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successText: { fontSize: 24, fontWeight: 'bold', color: '#1E2022', marginTop: 15 },

    // Form Styles
    title: { fontSize: 24, fontWeight: 'bold', color: '#1E2022', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 30 },

    starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
    textArea: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 15, height: 120, fontSize: 14, marginBottom: 25 },

    submitButton: { backgroundColor: '#2C64E3', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    skipButton: { paddingVertical: 15, alignItems: 'center' },
    skipButtonText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
});

