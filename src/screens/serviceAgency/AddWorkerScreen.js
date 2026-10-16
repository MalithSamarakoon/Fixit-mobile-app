import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { updateWorker } from './agencyService';
import CalendarPickerModal from './CalendarPickerModal';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORKER_TYPES = ['Electrician', 'Plumber', 'Carpenter', 'Cleaner', 'AC Technician', 'Painter', 'Mason', 'Gardener'];

const formatFriendlyDate = (value) => {
    if (!value) return 'Select start date';
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AddWorkerScreen({ navigation, route }) {
    const editingWorker = route?.params?.worker || null;
    const isEditMode = !!editingWorker;

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [workerType, setWorkerType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [errors, setErrors] = useState({});
    const [workerTypeModalVisible, setWorkerTypeModalVisible] = useState(false);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);

    useEffect(() => {
        if (!editingWorker) return;

        setFullName(editingWorker.fullName || editingWorker.name || '');
        setEmail(editingWorker.email || '');
        setPhone(editingWorker.phone || '');
        setWorkerType(editingWorker.workerType || editingWorker.trade || editingWorker.department || '');
        setStartDate(editingWorker.startDate || '');
        setPhotoURL(editingWorker.photoURL || '');
    }, [editingWorker]);

    const validateForm = () => {
        const nextErrors = {};

        if (!fullName.trim()) nextErrors.fullName = 'Full Name is required.';
        if (!email.trim()) nextErrors.email = 'Email is required.';
        else if (!emailRegex.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
        if (phone.trim() && !/^\d{10}$/.test(phone.trim().replace(/\s+/g, ''))) {
            nextErrors.phone = 'Phone number must be 10 digits.';
        }
        if (!workerType.trim()) nextErrors.workerType = 'Worker Type is required.';
        if (!startDate.trim()) nextErrors.startDate = 'Start Date is required.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const resetForm = () => {
        setFullName('');
        setEmail('');
        setPhone('');
        setWorkerType('');
        setStartDate('');
        setPhotoURL('');
        setErrors({});
    };

    const handlePhotoUpload = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile photo.');
                return;
            }

            setUploadingPhoto(true);
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            const selectedAsset = result.assets[0];
            const agencyId = auth.currentUser?.uid || 'agency';

            let nextPhotoURL = '';

            try {
                const storage = getStorage();
                const storageReference = storageRef(storage, `workerPhotos/${agencyId}_${Date.now()}.jpg`);
                const response = await fetch(selectedAsset.uri);
                const blob = await response.blob();
                await uploadBytes(storageReference, blob, { contentType: 'image/jpeg' });
                nextPhotoURL = await getDownloadURL(storageReference);
            } catch (storageError) {
                if (selectedAsset.base64) {
                    nextPhotoURL = `data:image/jpeg;base64,${selectedAsset.base64}`;
                } else if (selectedAsset.uri) {
                    nextPhotoURL = selectedAsset.uri;
                }
            }

            if (nextPhotoURL) {
                setPhotoURL(nextPhotoURL);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not upload photo.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleAddWorker = async () => {
        if (!validateForm()) return;

        const agencyId = auth.currentUser?.uid;
        if (!agencyId) {
            Alert.alert('Error', 'No logged-in agency found.');
            return;
        }

        setLoading(true);
        try {
            if (isEditMode) {
                await updateWorker(editingWorker.id, {
                    fullName: fullName.trim(),
                    name: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    photoURL: photoURL || editingWorker.photoURL || '',
                    workerType: workerType.trim(),
                    department: workerType.trim(),
                    trade: workerType.trim(),
                    startDate: startDate.trim(),
                });
                Alert.alert('Success', 'Worker profile updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
                return;
            }

            await addDoc(collection(db, 'users'), {
                fullName: fullName.trim(),
                name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                photoURL: photoURL || '',
                workerType: workerType.trim(),
                department: workerType.trim(),
                trade: workerType.trim(),
                startDate: startDate.trim(),
                agencyId: auth.currentUser.uid,
                role: 'worker',
                status: 'Available',
                createdAt: serverTimestamp(),
            });

            Alert.alert('Worker added successfully', '', [
                {
                    text: 'OK',
                    onPress: () => {
                        resetForm();
                        const routes = navigation.getState?.()?.routes || [];
                        const previousRoute = routes[routes.length - 2];
                        if (navigation.canGoBack && navigation.canGoBack() && previousRoute?.name === 'WorkersList') {
                            navigation.goBack();
                            return;
                        }
                        navigation.navigate('Workers', { screen: 'WorkersList' });
                    },
                },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? 'Edit Worker' : 'Add Worker'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.photoContainer}>
                    <TouchableOpacity onPress={handlePhotoUpload} disabled={uploadingPhoto}>
                        <View style={[styles.photoCircle, photoURL && styles.photoCircleFilled]}>
                            {uploadingPhoto ? (
                                <ActivityIndicator size="small" color="#5C8AF0" />
                            ) : photoURL ? (
                                <Image source={{ uri: photoURL }} style={styles.photoImage} />
                            ) : (
                                <Ionicons name="person-outline" size={40} color="#9CA3AF" />
                            )}
                            <View style={styles.cameraBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePhotoUpload} disabled={uploadingPhoto}>
                        <Text style={styles.uploadText}>{uploadingPhoto ? 'Uploading...' : 'Upload photo'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

                <Text style={styles.label}>Full Name <Text style={styles.asterisk}>*</Text></Text>
                <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                    <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={(text) => {
                            setFullName(text);
                            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                        }}
                    />
                </View>
                {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

                <Text style={styles.label}>Email Address <Text style={styles.asterisk}>*</Text></Text>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                    <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                    />
                </View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                <Text style={styles.label}>Phone Number</Text>
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                    <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={(text) => {
                            setPhone(text);
                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                    />
                </View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

                <Text style={[styles.sectionTitle, { marginTop: 10 }]}>EMPLOYMENT DETAILS</Text>

                <Text style={styles.label}>Worker Type <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                    style={[styles.inputDropdown, errors.workerType && styles.inputError]}
                    onPress={() => setWorkerTypeModalVisible(true)}
                >
                    <View style={styles.dropdownRow}>
                        <Ionicons name="people-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                        <Text style={[styles.dropdownText, !workerType && styles.placeholderText]}>
                            {workerType || 'Select worker type'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" style={{ marginRight: 15 }} />
                </TouchableOpacity>
                {errors.workerType ? <Text style={styles.errorText}>{errors.workerType}</Text> : null}

                <Text style={styles.label}>Start Date <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                    style={[styles.inputDropdown, errors.startDate && styles.inputError]}
                    onPress={() => setCalendarModalVisible(true)}
                >
                    <View style={styles.dropdownRow}>
                        <Ionicons name="calendar-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                        <Text style={[styles.dropdownText, !startDate && styles.placeholderText]}>
                            {startDate ? formatFriendlyDate(startDate) : 'Select start date'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" style={{ marginRight: 15 }} />
                </TouchableOpacity>
                {errors.startDate ? <Text style={styles.errorText}>{errors.startDate}</Text> : null}

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleAddWorker}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditMode ? 'Save Changes' : 'Add Worker'}</Text>}
                </TouchableOpacity>
            </ScrollView>

            <Modal transparent visible={workerTypeModalVisible} animationType="fade" onRequestClose={() => setWorkerTypeModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Worker Type</Text>
                        {WORKER_TYPES.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[styles.optionRow, workerType === item && styles.optionRowSelected]}
                                onPress={() => {
                                    setWorkerType(item);
                                    setWorkerTypeModalVisible(false);
                                    if (errors.workerType) setErrors((prev) => ({ ...prev, workerType: '' }));
                                }}
                            >
                                <Text style={styles.optionName}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            <CalendarPickerModal
                visible={calendarModalVisible}
                selectedDate={startDate}
                title="Select start date"
                onSelect={(date) => {
                    setStartDate(date || '');
                    if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: '' }));
                }}
                onClose={() => setCalendarModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAFA' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#fff' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

    photoContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    photoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#5C8AF0', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    uploadText: { marginTop: 10, color: '#5C8AF0', fontSize: 14, fontWeight: '600' },

    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 15, marginTop: 10 },
    label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
    asterisk: { color: '#EF4444' },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2F6', borderRadius: 12, height: 52, marginBottom: 8 },
    inputDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2F6', borderRadius: 12, height: 52, marginBottom: 8 },
    inputError: { borderColor: '#EF4444' },
    inputIcon: { marginLeft: 15, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#111827', paddingRight: 15 },
    inputFlex: { flex: 1, fontSize: 15, color: '#111827' },
    dropdownRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    dropdownText: { fontSize: 15, color: '#111827', paddingRight: 15 },
    placeholderText: { color: '#9CA3AF' },
    errorText: { color: '#EF4444', fontSize: 12, marginBottom: 14, marginLeft: 4 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.45)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { width: '88%', backgroundColor: '#fff', borderRadius: 18, padding: 16, maxHeight: '70%' },
    modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 12 },
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2F6' },
    optionRowSelected: { backgroundColor: '#EEF2FF' },
    optionName: { fontSize: 14, fontWeight: '700', color: '#111827' },

    submitBtn: { backgroundColor: '#5C8AF0', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    submitBtnDisabled: { backgroundColor: '#AFC2F7' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
