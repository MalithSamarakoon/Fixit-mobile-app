import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FindAgenciesScreen({ navigation }) {
    const agencies = [
        { id: '1', name: 'Lanka HomeCare Services' },
        { id: '2', name: 'PrimeFix Solutions' },
        { id: '3', name: 'Reliable Handyman Services' },
        { id: '4', name: 'ProHome Maintenance' },
        { id: '5', name: 'Urban Home Solutions' },
        { id: '6', name: 'QuickFix Service Agency' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Find Agencies</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {agencies.map(agency => (
                    <TouchableOpacity
                        key={agency.id}
                        style={styles.card}
                        onPress={() => navigation.navigate('AgencyBookingForm', { agency })}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="close-circle-outline" size={24} color="#2C64E3" />
                        </View>
                        <View style={styles.infoContainer}>
                            <Text style={styles.name}>{agency.name}</Text>
                            <Text style={styles.subtitle}>Verified Service Provider</Text>
                        </View>
                        <View style={styles.rightPill}>
                            <Ionicons name="remove" size={16} color="#2C64E3" />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    headerIconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    container: { paddingHorizontal: 20, paddingBottom: 20 },

    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 },
    iconContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#EDF2FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoContainer: { flex: 1 },
    name: { fontSize: 15, fontWeight: 'bold', color: '#1E2022', marginBottom: 3 },
    subtitle: { fontSize: 12, color: '#A0A0A0' },
    rightPill: { width: 35, height: 25, borderRadius: 12, backgroundColor: '#EDF2FE', justifyContent: 'center', alignItems: 'center' }
});
