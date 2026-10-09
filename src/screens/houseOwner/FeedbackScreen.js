import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FeedbackScreen({ navigation }) {
    const [rating, setRating] = useState(0);

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
                />

                <TouchableOpacity style={styles.submitButton} onPress={() => navigation.navigate('HomeScreen')}>
                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('HomeScreen')}>
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1E2022', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 30 },

    starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
    textArea: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 15, height: 120, fontSize: 14, marginBottom: 25 },

    submitButton: { backgroundColor: '#2C64E3', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    skipButton: { paddingVertical: 15, alignItems: 'center' },
    skipButtonText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
});
