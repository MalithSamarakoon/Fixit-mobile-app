import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { belongsToShop, formatCurrency, formatRevenue, getOrderStatusStyle } from './hardwareShopHelpers';

export default function HomeScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        revenue: 0,
        pendingOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);

    const shopOwnerId = auth.currentUser?.uid;

    const loadDashboard = useCallback(async () => {
        try {

            const [productsSnap, ordersSnap] = await Promise.all([
                getDocs(collection(db, 'products')),
                shopOwnerId
                    ? getDocs(query(collection(db, 'hardwareOrders'), where('shopOwnerId', '==', shopOwnerId)))
                    : getDocs(collection(db, 'hardwareOrders')),
            ]);

            const products = productsSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((p) => belongsToShop(p, shopOwnerId));

            const orders = ordersSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });

            const pendingCount = orders.filter((o) => o.status === 'Pending').length;
            const revenue = orders
                .filter((o) => ['Completed', 'Delivered', 'Confirmed'].includes(o.status))
                .reduce((sum, o) => sum + Number(o.total || 0), 0);

            const lowStock = products
                .filter((p) => Number(p.stock) <= 5)
                .sort((a, b) => Number(a.stock) - Number(b.stock))
                .slice(0, 4);

            setStats({
                totalProducts: products.length,
                totalOrders: orders.length,
                revenue,
                pendingOrders: pendingCount,
            });
            setRecentOrders(orders.slice(0, 3));
            setLowStockProducts(lowStock);
        } catch (error) {
            console.warn('Dashboard load failed:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [shopOwnerId]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadDashboard();
        }, [loadDashboard])
    );

    const goToTab = (tabName, params) => {
        navigation.getParent()?.navigate(tabName, params);
    };

    const openOrderDetails = (order) => {
        navigation.getParent()?.navigate('Orders', {
            screen: 'OrderDetails',
            params: { orderId: order.id },
        });
    };

    const renderOrderCard = (order) => {
        const style = getOrderStatusStyle(order.status);
        const itemCount = (order.items || []).reduce((acc, it) => acc + (it.qty || 1), 0);

        return (
            <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => openOrderDetails(order)}
            >
                <View style={styles.orderTop}>
                    <View style={styles.orderImgPlaceholder}>
                        <Ionicons name={order.icon || 'cube-outline'} size={24} color="#5C8AF0" />
                    </View>
                    <View style={styles.orderInfo}>
                        <View style={styles.orderTitleRow}>
                            <Text style={styles.orderId}>{order.orderNumber || order.id}</Text>
                            <View style={[styles.pendingPill, { backgroundColor: style.statusBg }]}>
                                <Text style={[styles.pendingText, { color: style.statusColor }]}>{order.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.orderTask}>{order.task || 'Hardware Supply'}</Text>
                        <View style={styles.orderMetaRow}>
                            <Text style={styles.customerName}>
                                <Ionicons name="person-outline" size={12} color="#6B7280" /> {order.customerName || 'Customer'}
                            </Text>
                            <Text style={styles.orderTime}>{order.time || 'Recently'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.orderCardFooter}>
                    <Text style={styles.orderItemsSnippet}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'} • {formatCurrency(order.total)}
                    </Text>
                    <View style={styles.viewOrderLink}>
                        <Text style={styles.viewOrderText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#5C8AF0" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.logoText}>Fix It</Text>
                    <Text style={styles.logoBadge}>Hardware Shop</Text>
                </View>
                <TouchableOpacity
                    style={styles.bellBtn}
                    onPress={() => goToTab('Orders')}
                    accessibilityLabel="View orders"
                >
                    <Ionicons name="notifications-outline" size={20} color="#111827" />
                    {stats.pendingOrders > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{stats.pendingOrders > 9 ? '9+' : stats.pendingOrders}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadDashboard();
                        }}
                        tintColor="#5C8AF0"
                    />
                }
            >
                <View style={styles.overviewHeader}>
                    <Text style={styles.pageTitle}>Dashboard Overview</Text>
                    <Text style={styles.pageSubtitle}>Real-time inventory and orders status for your hardware store.</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#5C8AF0" style={{ marginVertical: 40 }} />
                ) : (
                    <>
                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={() => navigation.navigate('ProductsList')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.statHeader}>
                                    <Text style={styles.statTitle}>Total Products</Text>
                                    <View style={[styles.statIconBg, { backgroundColor: '#EDF2FE' }]}>
                                        <Ionicons name="cube-outline" size={16} color="#5C8AF0" />
                                    </View>
                                </View>
                                <Text style={styles.statValue}>{stats.totalProducts}</Text>
                                <Text style={styles.statSub}>In catalog</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={() => goToTab('Orders')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.statHeader}>
                                    <Text style={styles.statTitle}>Total Orders</Text>
                                    <View style={[styles.statIconBg, { backgroundColor: '#EDF2FE' }]}>
                                        <Ionicons name="cart-outline" size={16} color="#5C8AF0" />
                                    </View>
                                </View>
                                <Text style={styles.statValue}>{stats.totalOrders}</Text>
                                <Text style={styles.statSub}>Processed</Text>
                            </TouchableOpacity>

                            <View style={styles.statCard}>
                                <View style={styles.statHeader}>
                                    <Text style={styles.statTitle}>Revenue</Text>
                                    <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
                                        <Ionicons name="cash-outline" size={16} color="#10B981" />
                                    </View>
                                </View>
                                <Text style={[styles.statValue, { color: '#10B981' }]}>{formatRevenue(stats.revenue)}</Text>
                                <Text style={styles.statSub}>Completed orders</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.statCard}
                                onPress={() => goToTab('Orders')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.statHeader}>
                                    <Text style={styles.statTitle}>Pending Orders</Text>
                                    <View style={[styles.statIconBg, { backgroundColor: '#FFF7ED' }]}>
                                        <Ionicons name="time-outline" size={16} color="#F59E0B" />
                                    </View>
                                </View>
                                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pendingOrders}</Text>
                                <Text style={styles.statSub}>Needs attention</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Actions Bar */}
                        <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 12 }]}>Quick Actions</Text>
                        <View style={styles.quickGrid}>
                            <TouchableOpacity
                                style={[styles.quickCard, styles.quickCardPrimary]}
                                onPress={() => navigation.navigate('AddProduct')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.quickIconCirclePrimary}>
                                    <Ionicons name="add" size={18} color="#fff" />
                                </View>
                                <Text style={styles.quickTextPrimary}>Add Product</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickCard}
                                onPress={() => navigation.navigate('ProductsList')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.quickIconCircle}>
                                    <Ionicons name="cube-outline" size={18} color="#5C8AF0" />
                                </View>
                                <Text style={styles.quickText}>Catalog</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickCard}
                                onPress={() => goToTab('Orders')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.quickIconCircle}>
                                    <Ionicons name="bag-check-outline" size={18} color="#5C8AF0" />
                                </View>
                                <Text style={styles.quickText}>Orders</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickCard}
                                onPress={() => goToTab('Ads')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.quickIconCircle}>
                                    <Ionicons name="pricetag-outline" size={18} color="#5C8AF0" />
                                </View>
                                <Text style={styles.quickText}>Promos</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Recent Orders Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Orders</Text>
                            <TouchableOpacity onPress={() => goToTab('Orders')}>
                                <Text style={styles.viewAllText}>View All ({stats.totalOrders})</Text>
                            </TouchableOpacity>
                        </View>

                        {recentOrders.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="receipt-outline" size={32} color="#D1D5DB" style={{ marginBottom: 6 }} />
                                <Text style={styles.emptyText}>No orders received yet.</Text>
                                <Text style={styles.emptySubText}>New hardware orders placed by clients will show up right here.</Text>
                            </View>
                        ) : (
                            recentOrders.map(renderOrderCard)
                        )}

                        {/* Low Stock Alerts */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('ProductsList')}>
                                <Text style={styles.viewAllText}>Manage Inventory</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.alertCard}>
                            {lowStockProducts.length === 0 ? (
                                <View style={styles.allStockedWrap}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 10 }} />
                                    <Text style={styles.emptyAlertText}>All inventory items are currently well stocked.</Text>
                                </View>
                            ) : (
                                <>
                                    {lowStockProducts.map((product) => (
                                        <TouchableOpacity
                                            key={product.id}
                                            style={styles.alertItem}
                                            activeOpacity={0.7}
                                            onPress={() => navigation.navigate('ProductDetails', { product })}
                                        >
                                            <View style={styles.alertDot} />
                                            <View style={styles.alertInfo}>
                                                <Text style={styles.alertName} numberOfLines={1}>{product.name}</Text>
                                                <Text style={styles.alertCategory}>{product.category || 'Hardware'}</Text>
                                            </View>
                                            <View style={styles.alertBadge}>
                                                <Text style={styles.alertQty}>
                                                    {product.stock <= 0 ? 'Out of stock' : `${product.stock} left`}
                                                </Text>
                                                <Ionicons name="chevron-forward" size={14} color="#F59E0B" />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.manageBtn}
                                        onPress={() => navigation.navigate('ProductsList')}
                                    >
                                        <Text style={styles.manageBtnText}>Update Stock Levels</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
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
    headerTitleWrap: { flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: '900', color: '#5C8AF0' },
    logoBadge: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#5C8AF0',
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 10,
    },
    bellBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    container: { paddingHorizontal: 20, paddingBottom: 40 },

    overviewHeader: { marginVertical: 18 },
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    pageSubtitle: { fontSize: 13, color: '#6B7280' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: {
        width: '48%',
        backgroundColor: '#F8F9FE',
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    statIconBg: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    statTitle: { fontSize: 12, color: '#6B7280', fontWeight: 'bold' },
    statValue: { fontSize: 20, fontWeight: '900', color: '#111827' },
    statSub: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
    viewAllText: { fontSize: 13, color: '#5C8AF0', fontWeight: 'bold' },

    emptyCard: {
        backgroundColor: '#F8F9FE',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        alignItems: 'center',
    },
    emptyText: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginTop: 4 },
    emptySubText: { fontSize: 12, color: '#6B7280', marginTop: 2, textAlign: 'center' },

    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
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
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderInfo: { flex: 1 },
    orderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderId: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
    pendingPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    pendingText: { fontSize: 10, fontWeight: 'bold' },
    orderTask: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    orderMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    customerName: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
    orderTime: { fontSize: 11, color: '#9CA3AF' },

    orderCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    orderItemsSnippet: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
    viewOrderLink: { flexDirection: 'row', alignItems: 'center' },
    viewOrderText: { color: '#5C8AF0', fontSize: 12, fontWeight: 'bold', marginRight: 2 },

    alertCard: { backgroundColor: '#F8F9FE', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 16 },
    allStockedWrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    emptyAlertText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
    },
    alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 10 },
    alertInfo: { flex: 1 },
    alertName: { fontSize: 14, color: '#111827', fontWeight: '600' },
    alertCategory: { fontSize: 11, color: '#9CA3AF' },
    alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    alertQty: { fontSize: 12, color: '#F59E0B', fontWeight: 'bold', marginRight: 2 },
    manageBtn: { backgroundColor: '#5C8AF0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    manageBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

    quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    quickCard: {
        width: '23%',
        alignItems: 'center',
        backgroundColor: '#F8F9FE',
        borderRadius: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    quickCardPrimary: {
        backgroundColor: '#EDF2FE',
        borderColor: '#DBEAFE',
    },
    quickIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    quickIconCirclePrimary: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#5C8AF0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    quickText: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
    quickTextPrimary: { fontSize: 11, fontWeight: 'bold', color: '#5C8AF0', textAlign: 'center' },
});
