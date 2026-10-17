import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { formatCurrency, getOrderStatusStyle } from '../hardwareShop/hardwareShopHelpers';

export default function HouseOwnerOrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const houseOwnerId = auth.currentUser?.uid;

    useEffect(() => {
        if (!houseOwnerId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'hardwareOrders'),
            where('houseOwnerId', '==', houseOwnerId)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = [];
                snapshot.forEach((docSnap) => {
                    list.push({ id: docSnap.id, ...docSnap.data() });
                });
                list.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });
                setOrders(list);
                setLoading(false);
                setRefreshing(false);
            },
            (err) => {
                console.warn('Error fetching house owner orders:', err.message);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, [houseOwnerId]);

    const renderOrderItem = ({ item }) => {
        const statusStyle = getOrderStatusStyle(item.status);
        const items = item.items || [];

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                    <View>
                        <Text style={styles.orderNumber}>{item.orderNumber || `#${item.id.slice(0, 6)}`}</Text>
                        <Text style={styles.orderTime}>{item.time || 'Placed recently'}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.statusBg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.statusColor }]}>
                            {item.status || 'Pending'}
                        </Text>
                    </View>
                </View>

                {/* Items breakdown */}
                <View style={styles.itemsBox}>
                    {items.map((it, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName} numberOfLines={1}>
                                {it.qty} × {it.name}
                            </Text>
                            <Text style={styles.itemPrice}>{formatCurrency(it.price * it.qty)}</Text>
                        </View>
                    ))}
                </View>

                {item.discount > 0 && (
                    <View style={styles.discountRow}>
                        <Text style={styles.discountLabel}>
                            Coupon Discount {item.discountCode ? `(${item.discountCode})` : ''}
                        </Text>
                        <Text style={styles.discountValue}>- {formatCurrency(item.discount)}</Text>
                    </View>
                )}

                <View style={styles.deliveryRow}>
                    <Ionicons name="location-outline" size={13} color="#6B7280" />
                    <Text style={styles.deliveryLocationText} numberOfLines={1}>
                        {item.deliveryLocation || 'Home Delivery'}
                    </Text>
                </View>

                {item.shopNotes ? (
                    <View style={styles.notesBox}>
                        <Text style={styles.notesTitle}>Note from Hardware Store:</Text>
                        <Text style={styles.notesText}>{item.shopNotes}</Text>
                    </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.orderBottomRow}>
                    <Text style={styles.totalLabel}>Total Paid</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(item.total)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Hardware Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3B66FE" style={{ marginTop: 40 }} />
            ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="receipt-outline" size={48} color="#5C8AF0" />
                    </View>
                    <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
                    <Text style={styles.emptySub}>
                        Orders you place with registered hardware shops will appear here with live delivery status.
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('HardwareProducts')}
                    >
                        <Text style={styles.browseButtonText}>Browse Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => setRefreshing(false)}
                            tintColor="#3B66FE"
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },

    listContent: { padding: 20, paddingBottom: 40 },

    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    orderTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    orderTime: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: 'bold' },

    itemsBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        gap: 6,
    },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
    itemName: { fontSize: 12, color: '#374151', flex: 1 },
    itemPrice: { fontSize: 12, fontWeight: '600', color: '#1E2022' },

    discountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    discountLabel: { fontSize: 12, color: '#10B981', fontWeight: '500' },
    discountValue: { fontSize: 12, fontWeight: 'bold', color: '#10B981' },

    deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    deliveryLocationText: { fontSize: 11, color: '#6B7280', flex: 1 },

    notesBox: {
        backgroundColor: '#EDF2FE',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
    },
    notesTitle: { fontSize: 11, fontWeight: 'bold', color: '#3B66FE', marginBottom: 2 },
    notesText: { fontSize: 11, color: '#4B5563' },

    divider: { height: 1, backgroundColor: '#EEF2F6', marginVertical: 8 },

    orderBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 13, color: '#6B7280' },
    totalAmount: { fontSize: 16, fontWeight: '900', color: '#10B981' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E2022', marginBottom: 6 },
    emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    browseButton: {
        backgroundColor: '#3B66FE',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    browseButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});
