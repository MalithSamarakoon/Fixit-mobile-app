import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EarningsScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Earnings & Payouts</Text>
                <TouchableOpacity>
                    <Ionicons name="download-outline" size={24} color="#5C8AF0" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Total Earnings Card */}
                <View style={styles.card}>
                    <View style={styles.totalTop}>
                        <Text style={styles.totalTitle}>Total Earnings This Month</Text>
                        <View style={styles.growthPill}>
                            <Ionicons name="trending-up" size={12} color="#10B981" style={{ marginRight: 4 }} />
                            <Text style={styles.growthText}>+18.4%</Text>
                        </View>
                    </View>
                    <Text style={styles.totalValue}>Rs. 48,500</Text>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Completed Jobs</Text>
                            <Text style={styles.statValue}>24 orders</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Avg. per Job</Text>
                            <Text style={styles.statValue}>Rs. 2,020</Text>
                        </View>
                    </View>
                </View>

                {/* Weekly Breakdown Chart Card */}
                <View style={styles.card}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Weekly{"\n"}Breakdown</Text>
                        <View style={styles.togglePill}>
                            <TouchableOpacity style={styles.toggleActive}><Text style={styles.toggleActiveText}>This Week</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.toggleInactive}><Text style={styles.toggleInactiveText}>Last Week</Text></TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.chartArea}>
                        {/* Bars mimicking your graph */}
                        <View style={styles.barCol}><View style={[styles.bar, styles.barLight, { height: 40 }]} /><Text style={styles.barLabel}>M</Text></View>
                        <View style={styles.barCol}><View style={[styles.bar, styles.barLight, { height: 60 }]} /><Text style={styles.barLabel}>T</Text></View>
                        <View style={styles.barCol}><View style={[styles.bar, styles.barLight, { height: 30 }]} /><Text style={styles.barLabel}>W</Text></View>
                        <View style={styles.barCol}><View style={[styles.bar, styles.barLight, { height: 70 }]} /><Text style={styles.barLabel}>T</Text></View>

                        {/* Highlighted Friday */}
                        <View style={styles.barCol}>
                            <View style={styles.tooltip}><Text style={styles.tooltipText}>Rs. 11.2k</Text></View>
                            <View style={[styles.bar, styles.barActive, { height: 90 }]} />
                            <Text style={[styles.barLabel, styles.barLabelActive]}>F</Text>
                        </View>

                        <View style={styles.barCol}><View style={[styles.bar, styles.barLight, { height: 55 }]} /><Text style={styles.barLabel}>S</Text></View>
                        <View style={styles.barCol}><View style={[styles.bar, styles.barLight, { height: 50 }]} /><Text style={styles.barLabel}>S</Text></View>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
                </View>

                <View style={styles.txCard}>
                    <View style={styles.txIconBox}><Ionicons name="flash-outline" size={20} color="#5C8AF0" /></View>
                    <View style={styles.txInfo}>
                        <Text style={styles.txName}>Nimal Perera</Text>
                        <Text style={styles.txSub}>Wiring Repair • 18 Sep</Text>
                    </View>
                    <View style={styles.txRight}>
                        <Text style={styles.txAmount}>+Rs. 3,500</Text>
                        <View style={styles.paidPill}><Text style={styles.paidText}>Paid</Text></View>
                    </View>
                </View>

                <View style={styles.txCard}>
                    <View style={styles.txIconBox}><Ionicons name="power-outline" size={20} color="#5C8AF0" /></View>
                    <View style={styles.txInfo}>
                        <Text style={styles.txName}>Amara Fernando</Text>
                        <Text style={styles.txSub}>Socket Fault • 15 Sep</Text>
                    </View>
                    <View style={styles.txRight}>
                        <Text style={styles.txAmount}>+Rs. 2,200</Text>
                        <View style={styles.paidPill}><Text style={styles.paidText}>Paid</Text></View>
                    </View>
                </View>

                <View style={styles.txCard}>
                    <View style={styles.txIconBox}><Ionicons name="snow-outline" size={20} color="#5C8AF0" /></View>
                    <View style={styles.txInfo}>
                        <Text style={styles.txName}>Dilshan Kumara</Text>
                        <Text style={styles.txSub}>Fan Installation • 12 Sep</Text>
                    </View>
                    <View style={styles.txRight}>
                        <Text style={styles.txAmount}>+Rs. 4,000</Text>
                        <View style={styles.pendingPill}><Text style={styles.pendingText}>Pending</Text></View>
                    </View>
                </View>

                <TouchableOpacity style={styles.exportBtn}>
                    <Ionicons name="push-outline" size={20} color="#5C8AF0" style={{ marginRight: 8 }} />
                    <Text style={styles.exportText}>Export Earnings Report</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

    container: { paddingHorizontal: 20, paddingBottom: 30 },

    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    totalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    totalTitle: { fontSize: 13, color: '#6B7280', fontWeight: 'bold' },
    growthPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    growthText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
    totalValue: { fontSize: 32, fontWeight: '900', color: '#111827' },

    divider: { height: 1, backgroundColor: '#EEF2F6', marginVertical: 15 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statCol: { flex: 1 },
    statLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
    statValue: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    statDivider: { width: 1, backgroundColor: '#EEF2F6', marginHorizontal: 15 },

    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', lineHeight: 22 },
    togglePill: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EEF2F6', overflow: 'hidden' },
    toggleActive: { backgroundColor: '#5C8AF0', paddingHorizontal: 12, paddingVertical: 6 },
    toggleActiveText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    toggleInactive: { paddingHorizontal: 12, paddingVertical: 6 },
    toggleInactiveText: { color: '#888', fontSize: 11, fontWeight: 'bold' },

    chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 20 },
    barCol: { alignItems: 'center', width: 35 },
    bar: { width: 28, borderRadius: 6, marginBottom: 8 },
    barLight: { backgroundColor: '#EDF2FE' },
    barActive: { backgroundColor: '#5C8AF0' },
    barLabel: { fontSize: 11, color: '#A0A0A0', fontWeight: 'bold' },
    barLabelActive: { color: '#111827' },
    tooltip: { position: 'absolute', top: -25, backgroundColor: '#5C8AF0', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    tooltipText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    viewAllText: { fontSize: 13, color: '#5C8AF0', fontWeight: 'bold' },

    txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F6' },
    txIconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#F8F9FE', borderWidth: 1, borderColor: '#EDF2FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    txInfo: { flex: 1 },
    txName: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    txSub: { fontSize: 12, color: '#888' },
    txRight: { alignItems: 'flex-end' },
    txAmount: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    paidPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    paidText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
    pendingPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    pendingText: { color: '#EA580C', fontSize: 10, fontWeight: 'bold' },

    exportBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 15, borderWidth: 1, borderColor: '#5C8AF0', marginTop: 10 },
    exportText: { color: '#5C8AF0', fontSize: 14, fontWeight: 'bold' }
});
