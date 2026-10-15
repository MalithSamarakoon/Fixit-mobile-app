import React, { useCallback, useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import { AuthContext } from '../../context/AuthContext';
import { getAgencyProfile, getAgencyWorkers, updateAgencyProfile } from './agencyService';

const serviceItems = [
    { label: 'Manage workers', icon: 'people-outline', target: 'Workers' },
    { label: 'Customer bookings', icon: 'calendar-outline', target: 'Bookings' },
    { label: 'Job assignments', icon: 'briefcase-outline', target: 'Home', params: { screen: 'NewJobAssignment' } },
];

export default function AgencyProfileScreen({ navigation }) {
    const { setUserRole } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({
        username: '',
        contactPerson: '',
        businessRegNo: '',
        about: '',
        mobile: '',
        address: '',
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [profileData, workersData] = await Promise.all([
                getAgencyProfile(),
                getAgencyWorkers(),
            ]);

            setProfile(profileData);
            setWorkers(workersData);
            setForm({
                username: profileData.username || '',
                contactPerson: profileData.contactPerson || '',
                businessRegNo: profileData.businessRegNo || '',
                about: profileData.about || '',
                mobile: profileData.mobile || '',
                address: profileData.address || '',
            });
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load agency profile.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleOpenEdit = () => {
        setForm({
            username: profile?.username || '',
            contactPerson: profile?.contactPerson || '',
            businessRegNo: profile?.businessRegNo || '',
            about: profile?.about || '',
            mobile: profile?.mobile || '',
            address: profile?.address || '',
        });
        setModalVisible(true);
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const updated = await updateAgencyProfile({
                username: form.username.trim(),
                contactPerson: form.contactPerson.trim(),
                businessRegNo: form.businessRegNo.trim(),
                about: form.about.trim(),
                mobile: form.mobile.trim(),
                address: form.address.trim(),
            });

            setProfile((prev) => ({ ...prev, ...updated }));
            setModalVisible(false);
            Alert.alert('Success', 'Agency profile updated successfully.');
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not update agency profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUserRole(null);
        } catch (error) {
            Alert.alert('Logout Error', error.message);
        }
    };

    const initials = (profile?.username || 'Agency').charAt(0).toUpperCase();
    const coreTeam = (workers || []).slice(0, 4);

    if (loading || !profile) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#5C8AF0" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Agency Profile</Text>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.logoSquare}>
                        <Text style={styles.logoText}>{initials}</Text>
                    </View>
                    <View style={styles.profileTextWrap}>
                        <Text style={styles.agencyName}>{profile.username || 'Agency Name'}</Text>
                        <View style={styles.verifiedRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#5C8AF0" />
                            <Text style={styles.verifiedText}>Verified Agency</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>About Us</Text>
                    <Text style={styles.aboutText}>{profile.about || 'No company overview added yet.'}</Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Our Services</Text>
                    {serviceItems.map((item) => (
                        <TouchableOpacity
                            key={item.label}
                            style={styles.serviceRow}
                            onPress={() => {
                                if (item.target === 'Workers') navigation.navigate('Workers');
                                else if (item.target === 'Bookings') navigation.navigate('Bookings');
                                else navigation.navigate(item.target, item.params || {});
                            }}
                        >
                            <View style={styles.serviceIconWrap}>
                                <Ionicons name={item.icon} size={18} color="#5C8AF0" />
                            </View>
                            <Text style={styles.serviceText}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Core Team</Text>
                    <View style={styles.teamRow}>
                        {coreTeam.length === 0 ? (
                            <Text style={styles.mutedText}>No team members yet.</Text>
                        ) : (
                            coreTeam.map((worker) => {
                                const workerName = worker.fullName || worker.name || 'Worker';
                                const initial = workerName.charAt(0).toUpperCase();
                                return (
                                    <View key={worker.id || workerName} style={styles.teamItem}>
                                        <View style={styles.teamAvatar}>
                                            <Text style={styles.teamAvatarText}>{initial}</Text>
                                        </View>
                                        <Text style={styles.teamName} numberOfLines={1}>{workerName}</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Contact Details</Text>
                    <View style={styles.contactRow}>
                        <Ionicons name="mail-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText}>{profile.email || 'No email available'}</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText}>{profile.mobile || 'No mobile number available'}</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText}>{profile.address || 'No address available'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenEdit}>
                    <Text style={styles.primaryBtnText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>Log out</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Edit Agency Profile</Text>

                        <Text style={styles.fieldLabel}>Agency Name</Text>
                        <TextInput
                            style={styles.input}
                            value={form.username}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, username: text }))}
                        />

                        <Text style={styles.fieldLabel}>Contact Person</Text>
                        <TextInput
                            style={styles.input}
                            value={form.contactPerson}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, contactPerson: text }))}
                        />

                        <Text style={styles.fieldLabel}>Business Registration Number</Text>
                        <TextInput
                            style={styles.input}
                            value={form.businessRegNo}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, businessRegNo: text }))}
                        />

                        <Text style={styles.fieldLabel}>About</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={form.about}
                            multiline
                            onChangeText={(text) => setForm((prev) => ({ ...prev, about: text }))}
                        />

                        <Text style={styles.fieldLabel}>Mobile</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="phone-pad"
                            value={form.mobile}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, mobile: text }))}
                        />

                        <Text style={styles.fieldLabel}>Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={form.address}
                            multiline
                            onChangeText={(text) => setForm((prev) => ({ ...prev, address: text }))}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveProfile} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalPrimaryText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { paddingHorizontal: 20, paddingBottom: 30 },
    header: { paddingTop: 18, paddingBottom: 12 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 16,
    },
    logoSquare: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#5C8AF0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    logoText: { color: '#fff', fontSize: 24, fontWeight: '800' },
    profileTextWrap: { flex: 1 },
    agencyName: { fontSize: 18, fontWeight: '800', color: '#111827' },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    verifiedText: { color: '#5C8AF0', fontSize: 12, fontWeight: '600', marginLeft: 4 },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
    aboutText: { color: '#4B5563', fontSize: 13, lineHeight: 20 },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    serviceIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EEF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    serviceText: { flex: 1, color: '#111827', fontSize: 14, fontWeight: '600' },
    teamRow: { flexDirection: 'row', justifyContent: 'space-between' },
    teamItem: { width: '23%', alignItems: 'center' },
    teamAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EAF1FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    teamAvatarText: { color: '#111827', fontWeight: '700' },
    teamName: { color: '#374151', fontSize: 11, textAlign: 'center' },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    contactText: { color: '#4B5563', fontSize: 13, marginLeft: 10, flex: 1 },
    primaryBtn: {
        backgroundColor: '#5C8AF0',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    logoutBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 14,
    },
    logoutBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
    mutedText: { color: '#6B7280', fontSize: 13 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 14 },
    fieldLabel: { color: '#374151', fontSize: 12, fontWeight: '700', marginBottom: 6 },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        color: '#111827',
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalSecondaryBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginRight: 8,
    },
    modalSecondaryText: { color: '#374151', fontSize: 14, fontWeight: '700' },
    modalPrimaryBtn: {
        flex: 1,
        backgroundColor: '#5C8AF0',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginLeft: 8,
    },
    modalPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
