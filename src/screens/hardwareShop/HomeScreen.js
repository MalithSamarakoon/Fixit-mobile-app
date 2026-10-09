import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>Fix It</Text>
                <TouchableOpacity style={styles.bellBtn}>
                    <Ionicons name="notifications-outline" size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Dashboard Overview */}
                <View style={styles.overviewHeader}>
                    <Text style={styles.pageTitle}>Dashboard Overview</Text>
                    <Text style={styles.pageSubtitle}>Here is your hardware business status today.</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statTitle}>Total Products</Text>
                            <Ionicons name="cube-outline" size={16} color="#5C8AF0" />
                        </View>
                        <Text style={styles.statValue}>128</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statTitle}>Total Orders</Text>
                            <Ionicons name="cart-outline" size={16} color="#5C8AF0" />
                        </View>
                        <Text style={styles.statValue}>56</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statTitle}>Revenue</Text>
                            <Ionicons name="card-outline" size={16} color="#10B981" />
                        </View>
                        <Text style={styles.statValue}>Rs 245,000</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statTitle}>Pending Orders</Text>
                            <Ionicons name="time-outline" size={16} color="#F59E0B" />
                        </View>
                        <Text style={styles.statValue}>12</Text>
                    </View>
                </View>

                {/* Recent Orders */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>
                    <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
                </View>

                {/* Order 1 */}
                <View style={styles.orderCard}>
                    <View style={styles.orderTop}>
                        <View style={styles.orderImgPlaceholder}>
                            <Ionicons name="construct-outline" size={24} color="#A0A0A0" />
                        </View>
                        <View style={styles.orderInfo}>
                            <View style={styles.orderTitleRow}>
                                <Text style={styles.orderId}>#8492</Text>
                                <View style={styles.pendingPill}><Text style={styles.pendingText}>Pending</Text></View>
                            </View>
                            <Text style={styles.orderTask}>Plumbing Emergency</Text>
                            <Text style={styles.orderTime}>Today, 2:30 PM</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.viewOrderBtn}>
                        <Text style={styles.viewOrderText}>View Order</Text>
                    </TouchableOpacity>
                </View>

                {/* Order 2 */}
                <View style={styles.orderCard}>
                    <View style={styles.orderTop}>
                        <View style={styles.orderImgPlaceholder}>
                            <Ionicons name="flash-outline" size={24} color="#A0A0A0" />
                        </View>
                        <View style={styles.orderInfo}>
                            <View style={styles.orderTitleRow}>
                                <Text style={styles.orderId}>#8488</Text>
                                <View style={styles.progressPill}><Text style={styles.progressText}>In Progress</Text></View>
                            </View>
                            <Text style={styles.orderTask}>Electrical Setup</Text>
                            <Text style={styles.orderTime}>Yesterday, 10:15 AM</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.viewOrderBtn}>
                        <Text style={styles.viewOrderText}>View Order</Text>
                    </TouchableOpacity>
                </View>

                {/* Low Stock Alerts */}
                <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 15 }]}>Low Stock Alerts</Text>
                <View style={styles.alertCard}>
                    <View style={styles.alertItem}>
                        <View style={styles.alertDot} />
                        <Text style={styles.alertName}>Copper Coupler 1/2"</Text>
                        <Text style={styles.alertQty}>Only 3 left</Text>
                    </View>
                    <View style={styles.alertItem}>
                        <View style={styles.alertDot} />
                        <Text style={styles.alertName}>Heavy Duty Pipe Wrench</Text>
                        <Text style={styles.alertQty}>Only 1 left</Text>
                    </View>
                    <TouchableOpacity style={styles.manageBtn}>
                        <Text style={styles.manageBtnText}>Manage Products</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 15 }]}>Quick Actions</Text>
                <View style={styles.quickGrid}>
                    <TouchableOpacity style={styles.quickCard}>
                        <Ionicons name="cube-outline" size={20} color="#5C8AF0" style={{ marginRight: 10 }} />
                        <Text style={styles.quickText}>Products</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCard}>
                        <Ionicons name="bag-check-outline" size={20} color="#5C8AF0" style={{ marginRight: 10 }} />
                        <Text style={styles.quickText}>Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCard}>
                        <Ionicons name="pricetag-outline" size={20} color="#5C8AF0" style={{ marginRight: 10 }} />
                        <Text style={styles.quickText}>Ads & Promos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCard}>
                        <Ionicons name="person-outline" size={20} color="#5C8AF0" style={{ marginRight: 10 }} />
                        <Text style={styles.quickText}>Profile</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    logoText: { fontSize: 24, fontWeight: '900', color: '#5C8AF0' },
    bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center' },

    container: { paddingHorizontal: 20, paddingBottom: 30 },

    overviewHeader: { marginVertical: 20 },
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
    pageSubtitle: { fontSize: 13, color: '#6B7280' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: { width: '48%', backgroundColor: '#F8F9FE', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    statTitle: { fontSize: 12, color: '#6B7280', fontWeight: 'bold' },
    statValue: { fontSize: 22, fontWeight: '900', color: '#111827' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    viewAllText: { fontSize: 13, color: '#5C8AF0', fontWeight: 'bold' },

    orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    orderTop: { flexDirection: 'row', marginBottom: 15 },
    orderImgPlaceholder: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    orderInfo: { flex: 1 },
    orderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderId: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
    pendingPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    pendingText: { color: '#F59E0B', fontSize: 10, fontWeight: 'bold' },
    progressPill: { backgroundColor: '#EDF2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    progressText: { color: '#5C8AF0', fontSize: 10, fontWeight: 'bold' },
    orderTask: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    orderTime: { fontSize: 12, color: '#888' },

    viewOrderBtn: { borderWidth: 1, borderColor: '#EDF2FE', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    viewOrderText: { color: '#5C8AF0', fontSize: 14, fontWeight: 'bold' },

    alertCard: { backgroundColor: '#F8F9FE', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEF2F6' },
    alertItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 10 },
    alertName: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '600' },
    alertQty: { fontSize: 13, color: '#F59E0B', fontWeight: 'bold' },
    manageBtn: { backgroundColor: '#5C8AF0', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 5 },
    manageBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    quickCard: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FE', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    quickText: { fontSize: 14, fontWeight: '600', color: '#111827' }
});
