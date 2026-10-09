import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerTrackingScreen({ navigation }) {
    const [progress, setProgress] = useState(0);

    // Simulate 5-second progress bar
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 3) {
                    clearInterval(interval);
                    navigation.navigate('Feedback'); // Auto-redirect when done
                    return 3;
                }
                return prev + 1;
            });
        }, 1250); // 1.25s * 4 steps = ~5 seconds

        return () => clearInterval(interval);
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.headerIconButton}>
                    <Ionicons name="close" size={20} color="#1E2022" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Worker Tracking</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.container}>
                {/* Simulated Map View */}
                <View style={styles.mapContainer}>
                    <Ionicons name="map-outline" size={60} color="#A0A0A0" />
                    <Text style={styles.mapText}>Live GPS Tracking View...</Text>
                </View>

                {/* Worker Profile Card */}
                <View style={styles.workerCard}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={30} color="#A0A0A0" />
                    </View>
                    <View style={styles.workerInfo}>
                        <View style={styles.workerHeaderRow}>
                            <Text style={styles.workerName}>Anura Silva</Text>
                            <View style={styles.statusPill}>
                                <Text style={styles.statusText}>● On the way</Text>
                            </View>
                        </View>
                        <Text style={styles.workerSub}>Professional Electrician • 8 Yrs Exp</Text>
                    </View>
                    <View style={styles.etaBox}>
                        <Text style={styles.etaTime}>12 min</Text>
                        <Text style={styles.etaLabel}>ETA</Text>
                    </View>
                </View>

                {/* Simulated Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressBarRow}>
                        <View style={[styles.progressSegment, progress >= 1 ? styles.progressActive : {}]} />
                        <View style={[styles.progressSegment, progress >= 2 ? styles.progressActive : {}]} />
                        <View style={[styles.progressSegment, progress >= 3 ? styles.progressActive : {}]} />
                    </View>
                    <View style={styles.progressTextRow}>
                        <Ionicons name="time-outline" size={18} color="#2C64E3" />
                        <Text style={styles.progressText}>Anura Silva is on the way to destination...</Text>
                    </View>
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

    container: { flex: 1, paddingHorizontal: 20 },

    mapContainer: { height: 350, backgroundColor: '#EFEFEF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    mapText: { color: '#888', marginTop: 10, fontWeight: 'bold' },

    workerCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    workerInfo: { flex: 1 },
    workerHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    workerName: { fontSize: 16, fontWeight: 'bold', color: '#1E2022', marginRight: 10 },
    statusPill: { backgroundColor: '#E6F8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    statusText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
    workerSub: { fontSize: 12, color: '#888' },

    etaBox: { backgroundColor: '#EDF2FE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
    etaTime: { color: '#2C64E3', fontSize: 14, fontWeight: 'bold' },
    etaLabel: { color: '#888', fontSize: 10 },

    progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    progressBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    progressSegment: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginHorizontal: 4 },
    progressActive: { backgroundColor: '#2C64E3' },
    progressTextRow: { flexDirection: 'row', alignItems: 'center' },
    progressText: { fontSize: 14, fontWeight: 'bold', color: '#1E2022', marginLeft: 10 },
});
