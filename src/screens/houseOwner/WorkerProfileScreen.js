import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerProfileScreen({ route, navigation }) {
    const { worker } = route.params;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header with rounded outline buttons */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                    {/* Reusing a blank view or arrow depending on preference, standard is back */}
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Worker Profile</Text>
                <TouchableOpacity style={styles.headerIconButton}>
                    <Ionicons name="options-outline" size={20} color="#1E2022" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Profile Avatar & Badges */}
                <View style={styles.profileTop}>
                    {/* Blue border ring around avatar */}
                    <View style={styles.avatarBorder}>
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={50} color="#A0A0A0" />
                        </View>
                    </View>
                    <Text style={styles.name}>{worker.name}</Text>

                    <View style={styles.tagsRow}>
                        <View style={styles.rolePill}>
                            <Text style={styles.roleText}>{worker.role}</Text>
                        </View>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusText}>● Available</Text>
                        </View>
                    </View>
                    <View style={styles.verifiedPill}>
                        <Ionicons name="checkmark-circle" size={14} color="#2C64E3" style={{ marginRight: 5 }} />
                        <Text style={styles.verifiedText}>Verified professional</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                    <View style={styles.activeTabContainer}>
                        <Text style={styles.activeTabText}>Overview</Text>
                    </View>
                    <View style={styles.tabContainer}>
                        <Text style={styles.tabText}>Work History</Text>
                    </View>
                    <View style={styles.tabContainer}>
                        <Text style={styles.tabText}>Documents</Text>
                    </View>
                </View>

                {/* Main Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoColLeft}>
                            <Text style={styles.infoLabel}>Phone Number</Text>
                            <Text style={styles.infoValue}>+94 77 123 4567</Text>
                        </View>
                        <View style={styles.infoColRight}>
                            <Text style={styles.infoLabel}>Experience</Text>
                            <Text style={styles.infoValue}>8 Years</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <View style={styles.infoColLeft}>
                            <Text style={styles.infoLabel}>Service Area</Text>
                            <Text style={styles.infoValue}>Colombo & Suburbs</Text>
                        </View>
                        <View style={styles.infoColRight}>
                            <Text style={styles.infoLabel}>Active Jobs</Text>
                            <Text style={[styles.infoValue, { color: '#2C64E3' }]}>2 Ongoing</Text>
                        </View>
                    </View>
                </View>

                {/* Customer Ratings Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Customer Ratings</Text>
                    <View style={styles.ratingScore}>
                        <Ionicons name="star" size={16} color="#F2A05B" />
                        <Text style={styles.ratingScoreText}> 4 / 5</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.reviewBlock}>
                        <Text style={styles.reviewName}>Chathura Weerasinghe</Text>
                        <Text style={styles.reviewText}>"Excellent prompt service. Resolved the electrical tripping issue quickly."</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.reviewBlock}>
                        <Text style={styles.reviewName}>Nilanthi De Zoysa</Text>
                        <Text style={styles.reviewText}>"Highly recommended. Courteous and very professional."</Text>
                    </View>
                </View>

                {/* Inquire Note Section */}
                <Text style={styles.sectionTitle}>Inquire or Add Note</Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Type a message to the worker..."
                    placeholderTextColor="#A0A0A0"
                    multiline={true}
                    textAlignVertical="top"
                />

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('TaskDescription')}>
                        <Text style={styles.bookButtonText}>Book</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    headerIconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    container: { paddingHorizontal: 20, paddingBottom: 40 },

    profileTop: { alignItems: 'center', marginBottom: 25 },
    avatarBorder: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#2C64E3', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 20, fontWeight: 'bold', color: '#1E2022', marginBottom: 10 },

    tagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    rolePill: { backgroundColor: '#EDF2FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
    roleText: { color: '#2C64E3', fontSize: 12, fontWeight: '600' },
    statusPill: { backgroundColor: '#E6F8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#10B981', fontSize: 12, fontWeight: '600' },

    verifiedPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2FE', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15 },
    verifiedText: { color: '#2C64E3', fontSize: 13, fontWeight: '600' },

    tabsRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 20 },
    tabContainer: { flex: 1, alignItems: 'center', paddingBottom: 10 },
    activeTabContainer: { flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#2C64E3' },
    tabText: { fontSize: 14, color: '#888', fontWeight: '500' },
    activeTabText: { fontSize: 14, color: '#2C64E3', fontWeight: 'bold' },

    infoCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 25 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoColLeft: { flex: 1 },
    infoColRight: { flex: 1, alignItems: 'flex-end' },
    infoLabel: { fontSize: 12, color: '#888', marginBottom: 5 },
    infoValue: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022', marginBottom: 10 },
    ratingScore: { flexDirection: 'row', alignItems: 'center' },
    ratingScoreText: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },

    reviewBlock: { paddingVertical: 5 },
    reviewName: { fontSize: 13, fontWeight: 'bold', color: '#1E2022', marginBottom: 5 },
    reviewText: { fontSize: 13, color: '#888', lineHeight: 18 },

    noteInput: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 15, height: 100, fontSize: 14, marginBottom: 25 },

    buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
    bookButton: { flex: 0.48, backgroundColor: '#2C64E3', paddingVertical: 15, borderRadius: 25, alignItems: 'center' },
    bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { flex: 0.48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF4D4D', paddingVertical: 15, borderRadius: 25, alignItems: 'center' },
    cancelButtonText: { color: '#FF4D4D', fontSize: 16, fontWeight: 'bold' },
});
