import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen({ navigation }) {
    // Dummy calendar data to match UI exactly
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weeks = [
        [{ d: 30, out: true }, { d: 31, out: true }, { d: 1 }, { d: 2 }, { d: 3, booked: true }, { d: 4 }, { d: 5 }],
        [{ d: 6 }, { d: 7 }, { d: 8, booked: true }, { d: 9 }, { d: 10 }, { d: 11, booked: true }, { d: 12 }],
        [{ d: 13 }, { d: 14 }, { d: 15 }, { d: 16, booked: true }, { d: 17 }, { d: 18 }, { d: 19 }],
        [{ d: 20 }, { d: 21 }, { d: 22 }, { d: 23, selected: true }, { d: 24 }, { d: 25, booked: true }, { d: 26 }],
        [{ d: 27 }, { d: 28 }, { d: 29 }, { d: 30 }, { d: 1, out: true }, { d: 2, out: true }, { d: 3, out: true }],
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Schedule & Calendar</Text>
                <TouchableOpacity style={styles.bellBtn}>
                    <Ionicons name="notifications-outline" size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Calendar Grid Card */}
                <View style={styles.calCard}>
                    <View style={styles.calMonthRow}>
                        <Ionicons name="chevron-back" size={18} color="#5C8AF0" />
                        <Text style={styles.monthText}>September 2026</Text>
                        <Ionicons name="chevron-forward" size={18} color="#5C8AF0" />
                    </View>

                    <View style={styles.weekDaysRow}>
                        {weekDays.map((day, i) => <Text key={i} style={styles.weekDayText}>{day}</Text>)}
                    </View>

                    {weeks.map((week, wIdx) => (
                        <View key={wIdx} style={styles.daysRow}>
                            {week.map((item, dIdx) => (
                                <View key={dIdx} style={styles.dayCell}>
                                    <View style={[
                                        styles.dayCircle,
                                        item.booked && styles.bookedCircle,
                                        item.selected && styles.selectedCircle
                                    ]}>
                                        <Text style={[
                                            styles.dayText,
                                            item.out && styles.outText,
                                            item.booked && styles.bookedText,
                                            item.selected && styles.selectedText
                                        ]}>{item.d}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EDF2FE' }]} /><Text style={styles.legendText}>Booked Day</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { borderWidth: 1, borderColor: '#A0A0A0', backgroundColor: 'transparent' }]} /><Text style={styles.legendText}>Available Day</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#5C8AF0' }]} /><Text style={[styles.legendText, { fontWeight: 'bold', color: '#111827' }]}>Selected Day</Text></View>
                    </View>
                </View>

                <TouchableOpacity style={styles.availBtn}>
                    <Ionicons name="calendar-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.availBtnText}>Set Work Availability</Text>
                </TouchableOpacity>

                <View style={styles.upcomingHeader}>
                    <Text style={styles.upcomingTitle}>Upcoming Jobs</Text>
                    <View style={styles.upcomingPill}><Text style={styles.upcomingPillText}>2 scheduled today</Text></View>
                </View>

                {/* Dummy Job 1 */}
                <View style={styles.jobCard}>
                    <View style={styles.jobTop}>
                        <View style={styles.jobTimeRow}>
                            <Ionicons name="time-outline" size={16} color="#5C8AF0" style={{ marginRight: 6 }} />
                            <Text style={styles.jobTimeText}>Wed, 23 Sep • 09:00 AM</Text>
                        </View>
                        <View style={styles.confirmedPill}><Text style={styles.confirmedText}>Confirmed</Text></View>
                    </View>

                    <View style={styles.jobMid}>
                        <View>
                            <Text style={styles.jobTask}>Wiring Repair</Text>
                            <View style={styles.jobUserRow}>
                                <Ionicons name="person-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                                <Text style={styles.jobUser}>Nimal Perera</Text>
                            </View>
                        </View>
                        <Text style={styles.jobIdText}>#8492</Text>
                    </View>

                    <View style={styles.jobBottom}>
                        <View style={styles.jobLocRow}>
                            <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                            <Text style={styles.jobLocText}>Colombo 03</Text>
                        </View>
                        <TouchableOpacity><Text style={styles.viewDetailsText}>View Details &gt;</Text></TouchableOpacity>
                    </View>
                </View>

                {/* Dummy Job 2 */}
                <View style={styles.jobCard}>
                    <View style={styles.jobTop}>
                        <View style={styles.jobTimeRow}>
                            <Ionicons name="time-outline" size={16} color="#5C8AF0" style={{ marginRight: 6 }} />
                            <Text style={styles.jobTimeText}>Wed, 23 Sep • 02:30 PM</Text>
                        </View>
                        <View style={styles.progressPill}><Text style={styles.progressText}>In Progress</Text></View>
                    </View>

                    <View style={styles.jobMid}>
                        <View>
                            <Text style={styles.jobTask}>Socket Replacement</Text>
                            <View style={styles.jobUserRow}>
                                <Ionicons name="person-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                                <Text style={styles.jobUser}>Amara Fernando</Text>
                            </View>
                        </View>
                        <Text style={styles.jobIdText}>#8488</Text>
                    </View>

                    <View style={styles.jobBottom}>
                        <View style={styles.jobLocRow}>
                            <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                            <Text style={styles.jobLocText}>Dehiwala</Text>
                        </View>
                        <TouchableOpacity><Text style={styles.viewDetailsText}>View Details &gt;</Text></TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 15, flex: 1 },
    bellBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F6' },

    container: { paddingHorizontal: 20, paddingBottom: 30 },

    calCard: { backgroundColor: '#EEF2FE', borderRadius: 24, padding: 20, marginBottom: 15 },
    calMonthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 20 },
    monthText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    weekDayText: { width: 30, textAlign: 'center', fontSize: 13, color: '#888', fontWeight: 'bold' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    dayCell: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    dayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    bookedCircle: { backgroundColor: '#D9E4FA' },
    selectedCircle: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#5C8AF0' },
    dayText: { fontSize: 14, color: '#111827' },
    outText: { color: '#D1D5DB' },
    bookedText: { color: '#2C64E3', fontWeight: 'bold' },
    selectedText: { color: '#5C8AF0', fontWeight: 'bold' },
    legendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
    legendText: { fontSize: 11, color: '#6B7280' },

    availBtn: { backgroundColor: '#5C8AF0', flexDirection: 'row', borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
    availBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    upcomingTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    upcomingPill: { backgroundColor: '#D9E4FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    upcomingPillText: { color: '#2C64E3', fontSize: 11, fontWeight: 'bold' },

    jobCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    jobTimeRow: { flexDirection: 'row', alignItems: 'center' },
    jobTimeText: { fontSize: 13, color: '#5C8AF0', fontWeight: '600' },
    confirmedPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    confirmedText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
    progressPill: { backgroundColor: '#EDF2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    progressText: { color: '#2C64E3', fontSize: 11, fontWeight: 'bold' },

    jobMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    jobTask: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    jobUserRow: { flexDirection: 'row', alignItems: 'center' },
    jobUser: { fontSize: 13, color: '#6B7280' },
    jobIdText: { fontSize: 18, fontWeight: '900', color: '#5C8AF0' },

    jobBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEF2F6', paddingTop: 15 },
    jobLocRow: { flexDirection: 'row', alignItems: 'center' },
    jobLocText: { fontSize: 13, color: '#6B7280' },
    viewDetailsText: { color: '#5C8AF0', fontSize: 13, fontWeight: 'bold' }
});
