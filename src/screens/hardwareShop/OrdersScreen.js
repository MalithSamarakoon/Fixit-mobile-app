import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen({ navigation }) {
    // Dummy Orders List
    const orders = [
        { id: '#8492', task: 'Plumbing Emergency', time: 'Today, 2:30 PM', status: 'Pending', statusColor: '#F59E0B', statusBg: '#FFF7ED', icon: 'construct-outline' },
        { id: '#8488', task: 'Electrical Setup', time: 'Yesterday, 10:15 AM', status: 'In Progress', statusColor: '#5C8AF0', statusBg: '#EDF2FE', icon: 'flash-outline' },
        { id: '#8472', task: 'AC Annual Tune-up', time: 'Oct 24, 2025', status: 'Completed', statusColor: '#10B981', statusBg: '#ECFDF5', icon: 'snow-outline' }
    ];

    const renderItem = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderTop}>
                <View style={styles.orderImgPlaceholder}>
                    <Ionicons name={item.icon} size={24} color="#A0A0A0" />
                </View>
                <View style={styles.orderInfo}>
                    <View style={styles.orderTitleRow}>
                        <Text style={styles.orderId}>{item.id}</Text>
                        <View style={[styles.statusPill, { backgroundColor: item.statusBg }]}>
                            <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.orderTask}>{item.task}</Text>
                    <Text style={styles.orderTime}>{item.time}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.viewOrderBtn}
                onPress={() => navigation.navigate('OrderDetails', { order: item })}
            >
                <Text style={styles.viewOrderText}>View Order</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput placeholder="Search orders..." placeholderTextColor="#A0A0A0" style={styles.searchInput} />
            </View>

            <Text style={styles.title}>Recent Orders</Text>

            <FlatList
                data={orders}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FE', marginHorizontal: 20, borderRadius: 25, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 20 },
    searchIcon: { marginRight: 5 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    title: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginHorizontal: 20, marginBottom: 15 },
    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },

    orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    orderTop: { flexDirection: 'row', marginBottom: 15 },
    orderImgPlaceholder: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    orderInfo: { flex: 1 },
    orderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderId: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
    statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    orderTask: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    orderTime: { fontSize: 12, color: '#888' },

    viewOrderBtn: { borderWidth: 1, borderColor: '#EDF2FE', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    viewOrderText: { color: '#5C8AF0', fontSize: 14, fontWeight: 'bold' },
});
