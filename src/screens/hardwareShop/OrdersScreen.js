import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { formatCurrency, getOrderStatusStyle } from './hardwareShopHelpers';
import { ensureSeedHardwareOrders } from './hardwareShopOrdersService';
import DeliveryRouteModal from './DeliveryRouteModal';

const STATUS_TABS = ['All', 'Pending', 'In Progress', 'Confirmed', 'Delivered', 'Rejected'];

export default function OrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [routeOrder, setRouteOrder] = useState(null);

    const shopOwnerId = auth.currentUser?.uid;

    const loadOrders = async () => {
        if (shopOwnerId) {
            await ensureSeedHardwareOrders(shopOwnerId);
        }
    };

    useEffect(() => {
        let unsubscribe = () => {};

        const start = async () => {
            await loadOrders();

            const q = shopOwnerId
                ? query(collection(db, 'hardwareOrders'), where('shopOwnerId', '==', shopOwnerId))
                : query(collection(db, 'hardwareOrders'));

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
                    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                    setOrders(list);
                    setLoading(false);
                    setRefreshing(false);
                },
                (err) => {
                    console.warn('Orders listener error:', err.message);
                    setLoading(false);
                    setRefreshing(false);
                }
            );
        };

        start();
        return () => unsubscribe();
    }, [shopOwnerId]);

    const statusCounts = useMemo(() => {
        const counts = { All: orders.length };
        STATUS_TABS.forEach((st) => {
            if (st !== 'All') {
                counts[st] = orders.filter((o) => o.status === st).length;
            }
        });
        return counts;
    }, [orders]);

    const filteredOrders = useMemo(() => {
        let list = [...orders];

        // Status Filter Tab
        if (selectedStatus !== 'All') {
            list = list.filter((o) => o.status === selectedStatus);
        }

        // Search Filter
        const term = search.trim().toLowerCase();
        if (term) {
            list = list.filter((o) => {
                const orderNum = (o.orderNumber || o.id || '').toLowerCase();
                const task = (o.task || '').toLowerCase();
                const customer = (o.customerName || '').toLowerCase();
                const phone = (o.customerPhone || '').toLowerCase();
                const itemsText = (o.items || []).map((it) => it.name).join(' ').toLowerCase();

                return (
                    orderNum.includes(term) ||
                    task.includes(term) ||
                    customer.includes(term) ||
                    phone.includes(term) ||
                    itemsText.includes(term)
                );
            });
        }

        return list;
    }, [orders, selectedStatus, search]);

    const renderItem = ({ item }) => {
        const style = getOrderStatusStyle(item.status);
        const items = item.items || [];
        const itemCount = items.reduce((sum, it) => sum + (it.qty || 1), 0);
        const itemNames = items.map((it) => it.name).filter(Boolean).join(', ');

        return (
            <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            >
                <View style={styles.orderTop}>
                    <View style={styles.orderImgPlaceholder}>
                        <Ionicons name={item.icon || 'cube-outline'} size={24} color="#5C8AF0" />
                    </View>
                    <View style={styles.orderInfo}>
                        <View style={styles.orderTitleRow}>
                            <Text style={styles.orderId}>{item.orderNumber || item.id}</Text>
                            <View style={[styles.statusPill, { backgroundColor: style.statusBg }]}>
                                <Text style={[styles.statusText, { color: style.statusColor }]}>{item.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.orderTask}>{item.task || 'Hardware Supply'}</Text>
                        <View style={styles.customerRow}>
                            <Ionicons name="person-circle-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                            <Text style={styles.customerName}>{item.customerName || 'Customer'}</Text>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Text style={styles.orderTime}>{item.time || 'Recently'}</Text>
                        </View>
                    </View>
                </View>

                {itemNames ? (
                    <Text style={styles.itemsSummary} numberOfLines={1}>
                        Items: {itemNames}
                    </Text>
                ) : null}

                {item.deliveryLocation ? (
                    <View style={styles.locationSnippetRow}>
                        <Ionicons name="location-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                        <Text style={styles.locationSnippetText} numberOfLines={1}>
                            {item.deliveryLocation}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.orderDivider} />

                <View style={styles.orderCardBottom}>
                    <View>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>{formatCurrency(item.total)}</Text>
                    </View>

                    <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                            style={styles.trackDeliveryCardBtn}
                            onPress={() => setRouteOrder(item)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="map-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                            <Text style={styles.trackDeliveryCardBtnText}>Track</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.viewOrderBtn}
                            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                        >
                            <Text style={styles.viewOrderText}>View</Text>
                            <Ionicons name="chevron-forward" size={14} color="#5C8AF0" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Orders Management</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search by order #, customer, or product..."
                    placeholderTextColor="#A0A0A0"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Status Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScroll}
                >
                    {STATUS_TABS.map((tab) => {
                        const count = statusCounts[tab] || 0;
                        const isActive = selectedStatus === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabChip, isActive && styles.tabChipActive]}
                                onPress={() => setSelectedStatus(tab)}
                            >
                                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                                    {tab}
                                </Text>
                                {count > 0 && (
                                    <View style={[styles.tabCountBadge, isActive && styles.tabCountBadgeActive]}>
                                        <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* List Header */}
            <View style={styles.listHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                    {selectedStatus === 'All' ? 'All Orders' : `${selectedStatus} Orders`}
                </Text>
                <Text style={styles.resultCount}>
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#5C8AF0" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadOrders();
                            }}
                            tintColor="#5C8AF0"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={54} color="#D1D5DB" style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyTitle}>
                                {search.trim() ? 'No Matching Orders' : `No ${selectedStatus === 'All' ? '' : selectedStatus} Orders`}
                            </Text>
                            <Text style={styles.emptySub}>
                                {search.trim()
                                    ? 'Try adjusting your search criteria.'
                                    : 'When new customer orders are placed, they will appear here.'}
                            </Text>
                            {(search.trim() || selectedStatus !== 'All') && (
                                <TouchableOpacity
                                    style={styles.resetFiltersBtn}
                                    onPress={() => {
                                        setSearch('');
                                        setSelectedStatus('All');
                                    }}
                                >
                                    <Text style={styles.resetFiltersBtnText}>Show All Orders</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            {/* Delivery Route Modal */}
            <DeliveryRouteModal
                visible={!!routeOrder}
                order={routeOrder}
                onClose={() => setRouteOrder(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FE',
        marginHorizontal: 20,
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 45,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginTop: 12,
        marginBottom: 10,
    },
    searchIcon: { marginRight: 6 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    tabsContainer: { marginBottom: 10 },
    tabsScroll: { paddingHorizontal: 20, gap: 8 },
    tabChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    tabChipActive: { backgroundColor: '#5C8AF0', borderColor: '#5C8AF0' },
    tabChipText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    tabChipTextActive: { color: '#fff', fontWeight: 'bold' },
    tabCountBadge: {
        marginLeft: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    tabCountBadgeActive: { backgroundColor: '#3B66FE' },
    tabCountText: { fontSize: 10, fontWeight: 'bold', color: '#4B5563' },
    tabCountTextActive: { color: '#fff' },

    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 6,
    },
    sectionHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    resultCount: { fontSize: 12, color: '#9CA3AF' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 30 },

    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    orderTop: { flexDirection: 'row' },
    orderImgPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderInfo: { flex: 1 },
    orderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    orderId: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    orderTask: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 3 },
    customerRow: { flexDirection: 'row', alignItems: 'center' },
    customerName: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
    dotSeparator: { marginHorizontal: 6, color: '#D1D5DB' },
    orderTime: { fontSize: 11, color: '#9CA3AF' },

    itemsSummary: { fontSize: 12, color: '#6B7280', marginTop: 10, fontStyle: 'italic' },
    locationSnippetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        backgroundColor: '#F0F5FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    locationSnippetText: { fontSize: 11, color: '#2563EB', fontWeight: '500', flex: 1 },

    orderDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    orderCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 11, color: '#9CA3AF' },
    totalAmount: { fontSize: 16, fontWeight: '900', color: '#111827' },
    cardActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    trackDeliveryCardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
    },
    trackDeliveryCardBtnText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold', marginLeft: 3 },
    viewOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
    },
    viewOrderText: { color: '#5C8AF0', fontSize: 12, fontWeight: 'bold', marginRight: 2 },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
    emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },
    resetFiltersBtn: {
        marginTop: 18,
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    resetFiltersBtnText: { color: '#5C8AF0', fontSize: 13, fontWeight: 'bold' },
});
