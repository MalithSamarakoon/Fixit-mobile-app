import React, { useCallback, useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { signOut, updatePassword } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';
import { AuthContext } from '../../context/AuthContext';
import { belongsToShop, validatePhone } from './hardwareShopHelpers';
import { geocodeAddress } from './hardwareDeliveryRouteService';
import {
    PHONE_VALIDATION_ERROR,
    belongsToShop,
    sanitizePhoneNumber,
    validatePhone,
} from './hardwareShopHelpers';

export default function ShopProfileScreen({ navigation }) {
    const { setUserRole } = useContext(AuthContext);

    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({ productsCount: 0, ordersCount: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({
        shopName: '',
        ownerName: '',
        mobile: '',
        location: '',
        businessHours: '',
        deliveryAvailable: true,
        businessRegNo: '',
        about: '',
    });
    const [formErrors, setFormErrors] = useState({});

    // Change Password Modal State
    const [passModalVisible, setPassModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const loadProfileData = useCallback(async () => {
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        try {
            const uid = auth.currentUser.uid;
            const userDocRef = doc(db, 'users', uid);

            const [userSnap, productsSnap, ordersSnap] = await Promise.all([
                getDoc(userDocRef),
                getDocs(collection(db, 'products')),
                getDocs(query(collection(db, 'hardwareOrders'), where('shopOwnerId', '==', uid))),
            ]);

            let data = {};
            if (userSnap.exists()) {
                data = userSnap.data();
            } else {
                data = {
                    name: auth.currentUser.displayName || 'Hardware Shop',
                    email: auth.currentUser.email,
                    role: 'HardwareShop',
                };
            }

            setUserData(data);

            const productsCount = productsSnap.docs
                .map((d) => d.data())
                .filter((p) => belongsToShop(p, uid)).length;

            setStats({
                productsCount,
                ordersCount: ordersSnap.docs.length,
            });

            const initialMobile = sanitizePhoneNumber(data.mobile || data.phone || '');

            setForm({
                shopName: data.shopName || data.name || data.username || 'Hardware Store',
                ownerName: data.ownerName || data.username || data.name || '',
                mobile: initialMobile,
                location: data.location || data.address || '',
                businessHours: data.businessHours || 'Mon - Sat: 8:00 AM - 6:30 PM',
                deliveryAvailable: data.deliveryAvailable !== false,
                businessRegNo: data.businessRegNo || '',
                about: data.about || '',
            });
        } catch (error) {
            console.warn('Profile fetch error:', error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProfileData();
        }, [loadProfileData])
    );

    // Real-time phone number change with strict validation
    const handleMobileChange = (text) => {
        // Rule: Accept numbers only, reject letters/symbols/spaces, max 10 digits
        const sanitized = sanitizePhoneNumber(text);
        setForm((prev) => ({ ...prev, mobile: sanitized }));

        // Real-time validation message: "Phone number must contain exactly 10 digits."
        if (sanitized.length === 0) {
            setFormErrors((prev) => ({ ...prev, mobile: 'Phone number is required.' }));
        } else if (sanitized.length < 10) {
            setFormErrors((prev) => ({ ...prev, mobile: PHONE_VALIDATION_ERROR }));
        } else if (sanitized.length === 10) {
            // Exactly 10 digits -> clear error
            setFormErrors((prev) => ({ ...prev, mobile: null }));
        }
    };

    const validateEditForm = () => {
        const errs = {};
        if (!form.shopName.trim()) {
            errs.shopName = 'Shop name is required.';
        }
        if (!form.ownerName.trim()) {
            errs.ownerName = 'Owner / Contact person name is required.';
        }

        // Phone validation on submit: exactly 10 numeric digits
        if (!form.mobile) {
            errs.mobile = 'Phone number is required.';
        } else if (!validatePhone(form.mobile)) {
            errs.mobile = PHONE_VALIDATION_ERROR;
        }

        if (!form.location.trim()) {
            errs.location = 'Shop location / address is required.';
        }

        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSaveProfile = async () => {
        if (!validateEditForm()) {
            Alert.alert('Validation Error', 'Please correct the highlighted fields.');
            return;
        }

        setSaving(true);
        try {
            const uid = auth.currentUser.uid;
            const cleanLoc = form.location.trim();
            // Preserving phone as string to retain leading zeros (e.g. "0771234567")
            const cleanPhoneString = String(form.mobile);

            const updatePayload = {
                shopName: form.shopName.trim(),
                name: form.shopName.trim(),
                username: form.shopName.trim(),
                ownerName: form.ownerName.trim(),
                mobile: cleanPhoneString,
                phone: cleanPhoneString,
                location: cleanLoc,
                address: cleanLoc,
                businessHours: form.businessHours.trim(),
                deliveryAvailable: form.deliveryAvailable,
                businessRegNo: form.businessRegNo.trim(),
                about: form.about.trim(),
            };

            // Attempt to resolve and save GPS coordinates for delivery routing
            try {
                const geo = await geocodeAddress(cleanLoc, true);
                if (geo && geo.lat && geo.lng) {
                    updatePayload.coordinates = { lat: geo.lat, lng: geo.lng };
                }
            } catch (geoErr) {
                console.warn('Shop profile geocoding error:', geoErr.message);
            }

            await updateDoc(doc(db, 'users', uid), updatePayload);
            setUserData((prev) => ({ ...prev, ...updatePayload }));
            setModalVisible(false);
            Alert.alert('Success', 'Shop profile details updated successfully.');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update shop profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'Passwords do not match.');
            return;
        }

        setChangingPassword(true);
        try {
            await updatePassword(auth.currentUser, newPassword);
            Alert.alert('Success', 'Password changed successfully.');
            setPassModalVisible(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update password. Try re-logging in.');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out of your Hardware Shop account?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await signOut(auth);
                        setUserRole(null);
                    } catch (error) {
                        Alert.alert('Error', error.message || 'Logout failed.');
                    }
                },
            },
        ]);
    };

    const handleCallStore = () => {
        if (!userData?.mobile && !userData?.phone) return;
        Linking.openURL(`tel:${userData.mobile || userData.phone}`).catch(() => {});
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#5C8AF0" />
                </View>
            </SafeAreaView>
        );
    }

    const shopInitials = (userData?.shopName || userData?.name || 'HS').charAt(0).toUpperCase();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Shop Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Hero Card */}
                <View style={styles.profileCard}>
                    <View style={styles.logoSquare}>
                        <Text style={styles.logoText}>{shopInitials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.shopNameText}>
                            {userData?.shopName || userData?.name || 'Hardware Shop'}
                        </Text>
                        <View style={styles.verifiedRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#5C8AF0" />
                            <Text style={styles.verifiedText}>Verified Hardware Store</Text>
                        </View>
                        <Text style={styles.ownerText}>
                            Managed by {userData?.ownerName || userData?.username || 'Owner'}
                        </Text>
                    </View>
                </View>

                {/* Quick Shop Metrics */}
                <View style={styles.statsRow}>
                    <TouchableOpacity
                        style={styles.statBox}
                        onPress={() => navigation.getParent()?.navigate('Dashboard', { screen: 'ProductsList' })}
                    >
                        <Text style={styles.statVal}>{stats.productsCount}</Text>
                        <Text style={styles.statLabel}>Products</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.statBox}
                        onPress={() => navigation.getParent()?.navigate('Orders')}
                    >
                        <Text style={styles.statVal}>{stats.ordersCount}</Text>
                        <Text style={styles.statLabel}>Total Orders</Text>
                    </TouchableOpacity>

                    <View style={styles.statBox}>
                        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                        <Text style={[styles.statLabel, { marginTop: 4, color: '#10B981', fontWeight: 'bold' }]}>
                            Active
                        </Text>
                    </View>
                </View>

                {/* Contact & Store Info */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Store & Contact Details</Text>

                    <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.detailIcon} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Contact Person</Text>
                            <Text style={styles.detailValue}>
                                {userData?.ownerName || userData?.username || 'Not set'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={18} color="#6B7280" style={styles.detailIcon} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Contact Phone</Text>
                            <Text style={styles.detailValue}>
                                {userData?.mobile || userData?.phone || 'Not set'}
                            </Text>
                        </View>
                        {(userData?.mobile || userData?.phone) && (
                            <TouchableOpacity onPress={handleCallStore} style={styles.callStoreBtn}>
                                <Ionicons name="call" size={14} color="#5C8AF0" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={18} color="#6B7280" style={styles.detailIcon} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Email Address</Text>
                            <Text style={styles.detailValue}>{auth.currentUser?.email || 'Not available'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={18} color="#6B7280" style={styles.detailIcon} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Store Address</Text>
                            <Text style={styles.detailValue}>
                                {userData?.location || userData?.address || 'Location not added'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={18} color="#6B7280" style={styles.detailIcon} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Operating Hours</Text>
                            <Text style={styles.detailValue}>
                                {userData?.businessHours || 'Mon - Sat: 8:00 AM - 6:30 PM'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="bicycle-outline" size={18} color="#6B7280" style={styles.detailIcon} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Delivery Service</Text>
                            <Text
                                style={[
                                    styles.detailValue,
                                    { color: userData?.deliveryAvailable !== false ? '#10B981' : '#6B7280' },
                                ]}
                            >
                                {userData?.deliveryAvailable !== false ? 'Delivery Available' : 'Pickup Only'}
                            </Text>
                        </View>
                    </View>

                    {userData?.businessRegNo ? (
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={18} color="#6B7280" style={styles.detailIcon} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Business Reg. No</Text>
                                <Text style={styles.detailValue}>{userData.businessRegNo}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* About Section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>About Our Hardware Store</Text>
                    <Text style={styles.aboutText}>
                        {userData?.about?.trim()
                            ? userData.about
                            : 'Supplier of authentic plumbing hardware, electrical equipment, construction fixtures, tools, and quality paint supplies. Contact us for bulk orders or specialized fittings.'}
                    </Text>
                </View>

                {/* Account Actions */}
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Edit Shop Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.changePassBtn} onPress={() => setPassModalVisible(true)}>
                    <Ionicons name="key-outline" size={18} color="#5C8AF0" style={{ marginRight: 8 }} />
                    <Text style={styles.changePassBtnText}>Change Account Password</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Edit Shop Profile Modal */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Shop Profile</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>
                                Shop Name <Text style={styles.req}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, formErrors.shopName && styles.inputErr]}
                                value={form.shopName}
                                onChangeText={(t) => {
                                    setForm((p) => ({ ...p, shopName: t }));
                                    if (formErrors.shopName) setFormErrors((p) => ({ ...p, shopName: null }));
                                }}
                            />
                            {formErrors.shopName && <Text style={styles.errText}>{formErrors.shopName}</Text>}

                            <Text style={styles.inputLabel}>
                                Owner / Contact Name <Text style={styles.req}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, formErrors.ownerName && styles.inputErr]}
                                value={form.ownerName}
                                onChangeText={(t) => {
                                    setForm((p) => ({ ...p, ownerName: t }));
                                    if (formErrors.ownerName) setFormErrors((p) => ({ ...p, ownerName: null }));
                                }}
                            />
                            {formErrors.ownerName && <Text style={styles.errText}>{formErrors.ownerName}</Text>}

                            {/* Contact Phone Number Input with strict 10-digit validation */}
                            <Text style={styles.inputLabel}>
                                Contact Phone Number (10 Digits) <Text style={styles.req}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, formErrors.mobile && styles.inputErr]}
                                keyboardType="number-pad"
                                maxLength={10}
                                value={form.mobile}
                                onChangeText={handleMobileChange}
                                placeholder="0771234567"
                                placeholderTextColor="#A0A0A0"
                            />
                            {formErrors.mobile ? (
                                <Text style={styles.errText}>{formErrors.mobile}</Text>
                            ) : (
                                <Text style={styles.inputHelperText}>
                                    {form.mobile.length}/10 digits • Numbers only
                                </Text>
                            )}

                            <Text style={styles.inputLabel}>
                                Store Location / Address <Text style={styles.req}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, formErrors.location && styles.inputErr]}
                                value={form.location}
                                onChangeText={(t) => {
                                    setForm((p) => ({ ...p, location: t }));
                                    if (formErrors.location) setFormErrors((p) => ({ ...p, location: null }));
                                }}
                            />
                            {formErrors.location && <Text style={styles.errText}>{formErrors.location}</Text>}

                            <Text style={styles.inputLabel}>Operating Hours</Text>
                            <TextInput
                                style={styles.input}
                                value={form.businessHours}
                                onChangeText={(t) => setForm((p) => ({ ...p, businessHours: t }))}
                                placeholder="e.g. Mon - Sat: 8:00 AM - 6:30 PM"
                            />

                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Delivery Service Available</Text>
                                <Switch
                                    value={form.deliveryAvailable}
                                    onValueChange={(val) => setForm((p) => ({ ...p, deliveryAvailable: val }))}
                                    trackColor={{ false: '#E5E7EB', true: '#5C8AF0' }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Business Registration Number</Text>
                            <TextInput
                                style={styles.input}
                                value={form.businessRegNo}
                                onChangeText={(t) => setForm((p) => ({ ...p, businessRegNo: t }))}
                                placeholder="Optional"
                            />

                            <Text style={styles.inputLabel}>About Store / Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                multiline
                                numberOfLines={3}
                                value={form.about}
                                onChangeText={(t) => setForm((p) => ({ ...p, about: t }))}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSaveBtn, saving && styles.btnDisabled]}
                                onPress={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                transparent
                visible={passModalVisible}
                animationType="fade"
                onRequestClose={() => setPassModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setPassModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            placeholder="At least 6 characters"
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPassModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSaveBtn, changingPassword && styles.btnDisabled]}
                                onPress={handleChangePassword}
                                disabled={changingPassword}
                            >
                                {changingPassword ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Update</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 14 },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FE',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 14,
    },
    logoSquare: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#5C8AF0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    profileInfo: { flex: 1 },
    shopNameText: { fontSize: 18, fontWeight: '800', color: '#111827' },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    verifiedText: { color: '#5C8AF0', fontSize: 12, fontWeight: '600', marginLeft: 4 },
    ownerText: { fontSize: 12, color: '#6B7280', marginTop: 3 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statBox: {
        flex: 1,
        backgroundColor: '#F8F9FE',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    statVal: { fontSize: 18, fontWeight: '900', color: '#111827' },
    statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },

    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 14,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 14 },

    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    detailIcon: { marginRight: 12 },
    detailLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
    detailValue: { fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 },
    callStoreBtn: {
        backgroundColor: '#EDF2FE',
        padding: 8,
        borderRadius: 8,
    },

    aboutText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },

    primaryBtn: {
        flexDirection: 'row',
        backgroundColor: '#5C8AF0',
        borderRadius: 14,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    changePassBtn: {
        flexDirection: 'row',
        backgroundColor: '#EDF2FE',
        borderRadius: 14,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    changePassBtnText: { color: '#5C8AF0', fontSize: 14, fontWeight: 'bold' },

    logoutBtn: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 14,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutBtnText: { color: '#EF4444', fontSize: 14, fontWeight: 'bold' },

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 380,
        borderRadius: 18,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 5, marginTop: 10 },
    req: { color: '#EF4444' },
    input: {
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 14,
        color: '#111827',
    },
    inputErr: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    errText: { color: '#EF4444', fontSize: 11, marginTop: 3 },
    inputHelperText: { color: '#6B7280', fontSize: 11, marginTop: 3 },
    textArea: { height: 70, textAlignVertical: 'top', paddingTop: 8 },

    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    switchLabel: { fontSize: 13, fontWeight: '600', color: '#111827' },

    modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
    modalCancelBtn: {
        flex: 1,
        height: 46,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelText: { color: '#4B5563', fontSize: 14, fontWeight: 'bold' },
    modalSaveBtn: {
        flex: 1,
        height: 46,
        borderRadius: 10,
        backgroundColor: '#5C8AF0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    modalSaveText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
