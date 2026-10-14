import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function BookingsScreen() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            setLoading(false);
            return;
        }

        // Real-time listener for this user's bookings
        const q = query(collection(db, 'bookings'), where('userId', '==', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Sort locally to show latest first
            list.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
                return timeB - timeA;
            });

            setBookings(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const performDelete = async (id) => {
        try {
            setDeletingId(id);
            await deleteDoc(doc(db, 'bookings', id));
        } catch (error) {
            console.error("Error deleting booking:", error);
            if (Platform.OS === 'web') {
                window.alert("Error deleting booking: " + error.message);
            } else {
                Alert.alert("Error", error.message || "Failed to delete booking.");
            }
        } finally {
            setDeletingId(null);
        }
    };

    const handleDelete = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to delete this booking history?")) {
                performDelete(id);
            }
        } else {
            Alert.alert(
                "Delete Booking",
                "Are you sure you want to delete this booking history?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => performDelete(id)
                    }
                ]
            );
        }
    };

    const renderItem = ({ item }) => {
        const displayName = item.workerName || item.agencyName || (item.workerTrade ? `${item.workerTrade} Specialist` : 'Service Provider');
        const displayDate = item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleDateString()
            : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown Date');

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.workerHeaderLeft}>
                        <Text style={styles.workerName}>{displayName}</Text>
                        {item.workerTrade ? (
                            <Text style={styles.workerTrade}>{item.workerTrade}</Text>
                        ) : null}
                    </View>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusText}>{item.status || 'Confirmed'}</Text>
                    </View>
                </View>

                <Text style={styles.detailText} numberOfLines={2}>
                    {item.taskDescription ? `Task: ${item.taskDescription}` : 'Task details not provided.'}
                </Text>

                {/* Uploaded Task Image Preview */}
                {item.imageUri ? (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: item.imageUri }}
                            style={styles.taskImage}
                            resizeMode="cover"
                        />
                    </View>
                ) : null}

                <Text style={styles.dateText}>{displayDate}</Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.priceText}>LKR {item.total || '0.00'}</Text>

                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                    >
                        {deletingId === item.id ? (
                            <ActivityIndicator size="small" color="#FF4D4D" />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={16} color="#FF4D4D" style={{ marginRight: 5 }} />
                                <Text style={styles.deleteText}>Delete</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2C64E3" />
                </View>
            ) : bookings.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No bookings found.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, marginBottom: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E2022' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#888', fontSize: 16 },

    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    workerHeaderLeft: { flex: 1, marginRight: 10 },
    workerName: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    workerTrade: { fontSize: 12, color: '#2C64E3', fontWeight: '600', marginTop: 2 },
    statusPill: { backgroundColor: '#E6F8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },

    detailText: { fontSize: 14, color: '#888', marginBottom: 10 },

    imageContainer: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#F3F4F6'
    },
    taskImage: {
        width: '100%',
        height: '100%'
    },

    dateText: { fontSize: 12, color: '#A0A0A0', marginBottom: 15 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 15 },
    priceText: { fontSize: 16, fontWeight: 'bold', color: '#2C64E3' },

    deleteButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    deleteText: { color: '#FF4D4D', fontSize: 14, fontWeight: 'bold' }
});
