import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updatePassword } from 'firebase/auth';
import { AuthContext } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
    const { setUserRole } = useContext(AuthContext);

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [username, setUsername] = useState('');
    const [mobile, setMobile] = useState('');
    const [location, setLocation] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [experience, setExperience] = useState('');
    const [serviceCharges, setServiceCharges] = useState('');

    // Change Password Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        if (!auth.currentUser) return;
        try {
            const docRef = doc(db, 'users', auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                
                // Populate editable fields
                setUsername(data.username || '');
                setMobile(data.mobile || '');
                setLocation(data.location || '');
                setServiceType(data.serviceType || '');
                setExperience(data.experience || '');
                setServiceCharges(data.serviceCharges || '');
            }
        } catch (error) {
            Alert.alert("Error", "Could not fetch user data");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!auth.currentUser) return;
        setSaving(true);
        try {
            const updatePayload = {
                username,
                mobile,
            };

            // Role specific fields
            if (userData.role === 'HouseOwner' || userData.role === 'HardwareShop') {
                updatePayload.location = location;
            } else if (userData.role === 'TradeWorker') {
                updatePayload.serviceType = serviceType;
                updatePayload.experience = experience;
                updatePayload.serviceCharges = serviceCharges;
            }

            const docRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(docRef, updatePayload);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters.");
            return;
        }
        setChangingPassword(true);
        try {
            await updatePassword(auth.currentUser, newPassword);
            Alert.alert("Success", "Password updated successfully!");
            setModalVisible(false);
            setNewPassword('');
        } catch (error) {
            // Note: Firebase might require re-authentication if the session is old
            Alert.alert("Update Error", error.message);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUserRole(null);
        } catch (error) {
            Alert.alert("Logout Error", error.message);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#5C8AF0" />
            </SafeAreaView>
        );
    }

    if (!userData) {
        return (
            <SafeAreaView style={styles.center}>
                <Text>User data not found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                {navigation.canGoBack() && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={20} color="#111827" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>{userData.role} Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                <View style={styles.profileBadge}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.roleText}>{userData.role}</Text>
                    <Text style={styles.emailText}>{userData.email}</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Name / Username</Text>
                    <TextInput style={styles.input} value={username} onChangeText={setUsername} />

                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />

                    {(userData.role === 'HouseOwner' || userData.role === 'HardwareShop') && (
                        <>
                            <Text style={styles.label}>Location / Address</Text>
                            <TextInput style={styles.input} value={location} onChangeText={setLocation} />
                        </>
                    )}

                    {userData.role === 'TradeWorker' && (
                        <>
                            <Text style={styles.label}>Service Type</Text>
                            <TextInput style={styles.input} value={serviceType} onChangeText={setServiceType} />

                            <Text style={styles.label}>Experience (Years)</Text>
                            <TextInput style={styles.input} value={experience} onChangeText={setExperience} keyboardType="numeric" />

                            <Text style={styles.label}>Service Charges (LKR)</Text>
                            <TextInput style={styles.input} value={serviceCharges} onChangeText={setServiceCharges} keyboardType="numeric" />
                        </>
                    )}

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.changePassBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.changePassBtnText}>Change Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <TextInput 
                            style={styles.modalInput} 
                            placeholder="New Password" 
                            secureTextEntry 
                            value={newPassword} 
                            onChangeText={setNewPassword} 
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleChangePassword} disabled={changingPassword}>
                                {changingPassword ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmText}>Update</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#fff' },
    backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    
    container: { paddingBottom: 40 },
    
    profileBadge: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 30, borderBottomWidth: 1, borderBottomColor: '#EEF2F6', marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#5C8AF0', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    roleText: { color: '#6B7280', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
    emailText: { color: '#9CA3AF', fontSize: 14 },

    formContainer: { paddingHorizontal: 20 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginBottom: 8, marginLeft: 5 },
    input: { backgroundColor: '#fff', borderRadius: 12, height: 50, paddingHorizontal: 15, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    
    saveBtn: { backgroundColor: '#5C8AF0', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    changePassBtn: { alignItems: 'center', marginVertical: 25 },
    changePassBtnText: { color: '#5C8AF0', fontSize: 15, fontWeight: '600' },

    logoutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center' },
    logoutBtnText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15, textAlign: 'center' },
    modalInput: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 15, height: 48, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
    modalCancelBtn: { flex: 1, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#F3F4F6', marginRight: 10 },
    modalCancelText: { color: '#6B7280', fontWeight: 'bold' },
    modalConfirmBtn: { flex: 1, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#5C8AF0', marginLeft: 10 },
    modalConfirmText: { color: '#fff', fontWeight: 'bold' }
});
