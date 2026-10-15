import React, { useEffect, useMemo, useState } from 'react';
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
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { getBusyWorkerIds, isWorkerBusy } from './agencyService';
import CalendarPickerModal from './CalendarPickerModal';
import TimePickerModal from './TimePickerModal';

const SERVICE_TYPES = ['Electrician', 'Plumber', 'Carpenter', 'Cleaner', 'AC Technician', 'Painter'];

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatFriendlyDate = (dateValue) => {
    if (!dateValue) return 'Select date';
    const date = new Date(`${dateValue}T00:00:00`);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
};

const parseTimeToMinutes = (slotLabel) => {
    const match = slotLabel.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let [, hours, minutes, meridiem] = match;
    let parsedHour = Number(hours);

    if (meridiem.toUpperCase() === 'PM' && parsedHour !== 12) parsedHour += 12;
    if (meridiem.toUpperCase() === 'AM' && parsedHour === 12) parsedHour = 0;

    return parsedHour * 60 + Number(minutes);
};

export default function NewJobAssignmentScreen({ navigation, route }) {
    const preselectedWorker = route?.params?.preselectedWorker || null;

    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [cost, setCost] = useState('');
    const [assignedWorker, setAssignedWorker] = useState(preselectedWorker || null);
    const [workers, setWorkers] = useState([]);
    const [busyWorkerIds, setBusyWorkerIds] = useState(new Set());
    const [serviceTypeModalVisible, setServiceTypeModalVisible] = useState(false);
    const [expertModalVisible, setExpertModalVisible] = useState(false);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (preselectedWorker) {
            setAssignedWorker(preselectedWorker);
        }
    }, [preselectedWorker]);

    useEffect(() => {
        setAssignedWorker(null);
        setExpertModalVisible(false);
    }, [serviceType]);

    useEffect(() => {
        const loadWorkers = async () => {
            if (!auth.currentUser?.uid) {
                setWorkers([]);
                return;
            }

            if (!serviceType) {
                setWorkers([]);
                return;
            }

            try {
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'worker'),
                    where('agencyId', '==', auth.currentUser.uid)
                );
                const snapshot = await getDocs(q);
                const list = snapshot.docs
                    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                    .filter((worker) => String(worker.status || 'Available').toLowerCase() !== 'inactive');
                setWorkers(list);
            } catch (error) {
                Alert.alert('Error', error.message || 'Could not load workers.');
            }
        };

        loadWorkers();
    }, [serviceType]);

    useEffect(() => {
        let cancelled = false;

        if (!selectedDate || !selectedTime) {
            setBusyWorkerIds(new Set());
            return undefined;
        }

        const refreshAvailability = async () => {
            try {
                const nextBusyWorkerIds = await getBusyWorkerIds(selectedDate, selectedTime);
                if (cancelled) return;

                setBusyWorkerIds(nextBusyWorkerIds);
                if (assignedWorker && nextBusyWorkerIds.has(assignedWorker.id)) {
                    const workerName = assignedWorker.fullName || assignedWorker.name || 'Worker';
                    setAssignedWorker(null);
                    Alert.alert(`${workerName} is busy at this time. Please choose another worker or time.`);
                }
            } catch (error) {
                if (!cancelled) Alert.alert('Error', error.message || 'Could not check worker availability.');
            }
        };

        refreshAvailability();
        return () => {
            cancelled = true;
        };
    }, [selectedDate, selectedTime]);

    const filteredWorkers = useMemo(() => {
        if (!serviceType) return [];
        const normalizedType = serviceType.toLowerCase();
        const matches = workers.filter((worker) => {
            const trade = (worker.trade || worker.department || '').toLowerCase();
            return trade === normalizedType || trade.includes(normalizedType);
        });
        return matches.length > 0 ? matches : workers;
    }, [serviceType, workers]);

    const noWorkerMatchMessage = useMemo(() => {
        if (!serviceType || workers.length === 0) return '';
        return filteredWorkers.length === workers.length && workers.some((worker) => {
            const trade = (worker.trade || worker.department || '').toLowerCase();
            return trade !== serviceType.toLowerCase() && !trade.includes(serviceType.toLowerCase());
        }) ? `No ${serviceType} workers — showing all workers` : '';
    }, [filteredWorkers, serviceType, workers]);

    const isTodaySelected = selectedDate === toDateKey(new Date());

    const getTimeSlotDisabled = (slotLabel) => {
        if (!isTodaySelected) return false;
        const now = new Date();
        const slotMinutes = parseTimeToMinutes(slotLabel);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return slotMinutes < currentMinutes;
    };

    const resetForm = () => {
        setCustomerName('');
        setPhone('');
        setServiceType('');
        setDescription('');
        setAddress('');
        setSelectedDate('');
        setSelectedTime('');
        setCost('');
        setAssignedWorker(null);
        setErrors({});
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!customerName.trim()) nextErrors.customerName = 'Customer Name is required.';
        if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) nextErrors.phone = 'Phone number must be 10 digits.';
        if (!serviceType) nextErrors.serviceType = 'Service Type is required.';
        if (!description.trim()) nextErrors.problemDescription = 'Problem Description is required.';
        if (!address.trim()) nextErrors.address = 'Service Address is required.';
        if (!selectedDate) nextErrors.date = 'Preferred Date is required.';
        if (!selectedTime) nextErrors.time = 'Preferred Time is required.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleAssignJob = async () => {
        if (!validateForm()) {
            return;
        }

        if (!auth.currentUser?.uid) {
            Alert.alert('Error', 'No logged-in agency found.');
            return;
        }

        setLoading(true);

        try {
            if (assignedWorker) {
                const busy = await isWorkerBusy(assignedWorker.id, selectedDate, selectedTime);
                if (busy) {
                    const workerName = assignedWorker.fullName || assignedWorker.name || 'Worker';
                    Alert.alert(`${workerName} is busy at this time. Please choose another worker or time.`);
                    setLoading(false);
                    return;
                }
            }

            const agencyDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            const agencyName = agencyDoc.exists()
                ? agencyDoc.data()?.username || agencyDoc.data()?.businessName || agencyDoc.data()?.agencyName || 'Agency'
                : 'Agency';

            const bookingPayload = {
                customerName: customerName.trim(),
                customerPhone: phone.trim(),
                serviceType,
                problemDescription: description.trim(),
                address: address.trim(),
                preferredDate: selectedDate,
                preferredTime: selectedTime,
                estimatedCost: cost ? Number(String(cost).replace(/[^0-9]/g, '')) : 0,
                agencyId: auth.currentUser.uid,
                agencyName,
                assignedWorkerName: '',
                status: 'Pending',
                createdAt: serverTimestamp(),
            };

            if (assignedWorker) {
                bookingPayload.assignedWorkerId = assignedWorker.id;
                bookingPayload.assignedWorkerName = assignedWorker.fullName || assignedWorker.name || '';
                bookingPayload.status = 'Assigned';
                bookingPayload.assignedAt = serverTimestamp();
            }

            await addDoc(collection(db, 'bookings'), bookingPayload);
            Alert.alert('Job created');
            resetForm();
            navigation.navigate('Bookings', { screen: 'BookingsList' });
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not create job.');
        } finally {
            setLoading(false);
        }
    };

    const renderExpertOption = (worker) => {
        const name = worker.fullName || worker.name || 'Worker';
        const isBusyAtTime = busyWorkerIds.has(worker.id);
        const dotColor = isBusyAtTime ? '#F59E0B' : '#10B981';

        return (
            <TouchableOpacity
                key={worker.id}
                style={[styles.optionRow, assignedWorker?.id === worker.id && styles.optionRowSelected, isBusyAtTime && styles.optionRowBusy]}
                disabled={isBusyAtTime}
                onPress={() => {
                    if (isBusyAtTime) return;
                    setAssignedWorker(worker);
                    setExpertModalVisible(false);
                }}
            >
                <View style={styles.optionAvatar}>
                    <Text style={styles.optionAvatarText}>{(name.charAt(0) || 'W').toUpperCase()}</Text>
                </View>

                <View style={styles.optionMeta}>
                    <Text style={styles.optionName}>{name}</Text>
                    <Text style={styles.optionTrade}>{worker.trade || worker.department || 'General Worker'}</Text>
                    {isBusyAtTime ? <Text style={styles.busyLabel}>Busy at this time</Text> : null}
                </View>

                <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Job Assignment</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.blueCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Create Assignment</Text>
                    </View>

                    <Text style={styles.label}>Customer Name</Text>
                    <TextInput
                        style={[styles.input, errors.customerName && styles.inputError]}
                        value={customerName}
                        onChangeText={(value) => {
                            setCustomerName(value);
                            if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                        }}
                    />
                    {errors.customerName ? <Text style={styles.errorText}>{errors.customerName}</Text> : null}

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, errors.phone && styles.inputError]}
                        value={phone}
                        keyboardType="numeric"
                        onChangeText={(value) => {
                            setPhone(value.replace(/\D/g, '').slice(0, 10));
                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                    />
                    {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

                    <Text style={styles.label}>Service Type Required</Text>
                    <TouchableOpacity
                        style={[styles.inputDropdown, errors.serviceType && styles.inputError]}
                        onPress={() => setServiceTypeModalVisible(true)}
                    >
                        <Text style={[styles.dropdownText, !serviceType && styles.placeholderText]}>
                            {serviceType || 'Select service type'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#111827" style={styles.dropdownIcon} />
                    </TouchableOpacity>
                    {errors.serviceType ? <Text style={styles.errorText}>{errors.serviceType}</Text> : null}

                    <Text style={styles.label}>Problem Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, errors.problemDescription && styles.inputError]}
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={(value) => {
                            setDescription(value);
                            if (errors.problemDescription) setErrors((prev) => ({ ...prev, problemDescription: '' }));
                        }}
                    />
                    {errors.problemDescription ? <Text style={styles.errorText}>{errors.problemDescription}</Text> : null}

                    <Text style={styles.label}>Service Address</Text>
                    <View style={[styles.inputWithIcon, errors.address && styles.inputError]}>
                        <Ionicons name="location-outline" size={20} color="#EF4444" style={styles.inputLeftIcon} />
                        <TextInput
                            style={styles.inputFlex}
                            value={address}
                            onChangeText={(value) => {
                                setAddress(value);
                                if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                            }}
                        />
                    </View>
                    {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

                    <Text style={styles.label}>Preferred Date</Text>
                    <TouchableOpacity
                        style={[styles.inputDropdown, errors.date && styles.inputError]}
                        onPress={() => setCalendarModalVisible(true)}
                    >
                        <Text style={[styles.dropdownText, !selectedDate && styles.placeholderText]}>
                            {selectedDate ? formatFriendlyDate(selectedDate) : 'Select preferred date'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#111827" style={styles.dropdownIcon} />
                    </TouchableOpacity>
                    {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

                    <Text style={styles.label}>Preferred Time</Text>
                    <TouchableOpacity
                        style={[styles.inputDropdown, errors.time && styles.inputError, !selectedDate && styles.disabledDropdown]}
                        disabled={!selectedDate}
                        onPress={() => setTimeModalVisible(true)}
                    >
                        <Text style={[styles.dropdownText, !selectedTime && styles.placeholderText]}>
                            {selectedTime || 'Select preferred time'}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="#111827" style={styles.dropdownIcon} />
                    </TouchableOpacity>
                    {errors.time ? <Text style={styles.errorText}>{errors.time}</Text> : null}

                    <Text style={styles.label}>Estimated Cost (LKR)</Text>
                    <View style={[styles.costInputWrap, errors.cost && styles.inputError]}>
                        <Text style={styles.currencyLabel}>LKR</Text>
                        <TextInput
                            style={styles.costInput}
                            value={cost}
                            keyboardType="numeric"
                            onChangeText={(value) => setCost(value.replace(/\D/g, ''))}
                        />
                    </View>

                    <Text style={styles.label}>Assigned Expert Specialist</Text>
                    <TouchableOpacity
                        style={[styles.workerDropdown, !serviceType && styles.disabledDropdown]}
                        disabled={!serviceType || loading}
                        onPress={() => {
                            if (serviceType) setExpertModalVisible(true);
                        }}
                    >
                        <View style={styles.workerDropLeft}>
                            <View style={styles.workerAvatar}>
                                <Ionicons name="person" size={18} color="#A0A0A0" />
                            </View>
                            <View>
                                <Text style={styles.workerName}>
                                    {!serviceType
                                        ? 'Select service type first'
                                        : !selectedDate || !selectedTime
                                            ? 'Choose date and time to check availability'
                                            : assignedWorker
                                                ? assignedWorker.fullName || assignedWorker.name || 'Worker'
                                                : 'Select expert'}
                                </Text>
                                {assignedWorker ? (
                                    <Text style={styles.workerSub}>{assignedWorker.trade || assignedWorker.department || 'Worker'} </Text>
                                ) : null}
                            </View>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#111827" />
                    </TouchableOpacity>

                    {noWorkerMatchMessage ? <Text style={styles.infoText}>{noWorkerMatchMessage}</Text> : null}

                    <TouchableOpacity style={styles.assignBtn} onPress={handleAssignJob} disabled={loading}>
                        {loading ? <ActivityIndicator color="#6B8DF2" /> : <Text style={styles.assignBtnText}>Assign Job</Text>}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelBtnText}>Cancel & Exit</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal transparent visible={serviceTypeModalVisible} animationType="fade" onRequestClose={() => setServiceTypeModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Service Type</Text>
                        {SERVICE_TYPES.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[styles.optionRow, serviceType === item && styles.optionRowSelected]}
                                onPress={() => {
                                    setServiceType(item);
                                    setServiceTypeModalVisible(false);
                                }}
                            >
                                <Text style={styles.optionName}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={expertModalVisible} animationType="fade" onRequestClose={() => setExpertModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Assigned Expert</Text>
                        {filteredWorkers.length > 0 ? (
                            filteredWorkers.map((worker) => renderExpertOption(worker))
                        ) : (
                            <Text style={styles.emptyModalText}>No workers available</Text>
                        )}
                    </View>
                </View>
            </Modal>

            <CalendarPickerModal
                visible={calendarModalVisible}
                selectedDate={selectedDate}
                minDate={toDateKey(new Date())}
                title="Preferred date"
                onSelect={(date) => {
                    setSelectedDate(date || '');
                    if (date) {
                        const isToday = date === toDateKey(new Date());
                        if (!isToday && selectedTime) {
                            setSelectedTime('');
                        }
                    } else {
                        setSelectedTime('');
                    }
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                onClose={() => setCalendarModalVisible(false)}
            />

            <TimePickerModal
                visible={timeModalVisible}
                selectedTime={selectedTime}
                selectedDate={selectedDate}
                disablePastForToday={true}
                onSelect={(time) => {
                    setSelectedTime(time);
                    if (errors.time) setErrors((prev) => ({ ...prev, time: '' }));
                }}
                onClose={() => setTimeModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    blueCard: { backgroundColor: '#6C8CF2', borderRadius: 24, padding: 20, marginTop: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    label: { color: '#E0E7FF', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderRadius: 12, height: 50, paddingHorizontal: 15, fontSize: 14, color: '#111827' },
    inputError: { borderWidth: 1, borderColor: '#FCA5A5' },
    errorText: { color: '#FEE2E2', fontSize: 12, marginTop: 6 },
    inputDropdown: { backgroundColor: '#fff', borderRadius: 12, height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, justifyContent: 'space-between' },
    dropdownText: { fontSize: 14, color: '#111827' },
    placeholderText: { color: '#9CA3AF' },
    dropdownIcon: { marginLeft: 10 },
    textArea: { height: 80, textAlignVertical: 'top', paddingTop: 15 },
    inputWithIcon: { backgroundColor: '#fff', borderRadius: 12, height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    inputLeftIcon: { marginRight: 10 },
    inputFlex: { flex: 1, fontSize: 14, color: '#111827' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfWidth: { width: '100%' },
    dateChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    dateChip: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
    dateChipSelected: { backgroundColor: '#5C8AF0' },
    dateChipText: { fontSize: 11, fontWeight: '700', color: '#111827' },
    dateChipTextSelected: { color: '#fff' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    timeChip: { width: '30%', margin: '1.5%', backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    timeChipSelected: { backgroundColor: '#5C8AF0', borderColor: '#5C8AF0' },
    timeChipDisabled: { opacity: 0.45 },
    timeChipText: { color: '#111827', fontSize: 12, fontWeight: '700' },
    timeChipTextSelected: { color: '#fff' },
    timeChipTextDisabled: { color: '#6B7280' },
    costInputWrap: { backgroundColor: '#fff', borderRadius: 12, height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    currencyLabel: { color: '#111827', fontWeight: '700', marginRight: 8 },
    costInput: { flex: 1, fontSize: 14, color: '#111827', textAlign: 'left' },
    workerDropdown: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    disabledDropdown: { opacity: 0.6 },
    workerDropLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    workerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    workerName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
    workerSub: { fontSize: 12, color: '#F59E0B', fontWeight: 'bold' },
    infoText: { color: '#E0F2FE', fontSize: 12, marginTop: 8 },
    assignBtn: { backgroundColor: '#fff', borderRadius: 25, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    assignBtnText: { color: '#6C8CF2', fontSize: 16, fontWeight: 'bold' },
    cancelBtn: { backgroundColor: '#fff', borderRadius: 25, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    cancelBtnText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.45)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { width: '88%', backgroundColor: '#fff', borderRadius: 18, padding: 16, maxHeight: '70%' },
    modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 12 },
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2F6' },
    optionRowSelected: { backgroundColor: '#EEF2FF' },
    optionRowBusy: { opacity: 0.55 },
    optionAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    optionAvatarText: { color: '#111827', fontWeight: '700' },
    optionMeta: { flex: 1 },
    optionName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    optionTrade: { fontSize: 12, color: '#6B7280' },
    busyLabel: { fontSize: 12, color: '#F59E0B', fontWeight: '700', marginTop: 2 },
    emptyModalText: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
});
