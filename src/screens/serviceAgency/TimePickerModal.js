import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = ['00', '15', '30', '45'];
const MERIDIEMS = ['AM', 'PM'];

const parseTimeToMinutes = (time) => {
    if (!time) return null;
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let [, hours, minutes, meridiem] = match;
    let hour = Number(hours);
    if (meridiem.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return hour * 60 + Number(minutes);
};

const formatTime = (hour, minute, meridiem) => `${hour}:${minute} ${meridiem}`;

export default function TimePickerModal({
    visible,
    selectedTime,
    onSelect,
    onClose,
    disablePastForToday,
    selectedDate,
}) {
    const [hour, setHour] = useState(10);
    const [minute, setMinute] = useState('00');
    const [meridiem, setMeridiem] = useState('AM');
    const [message, setMessage] = useState('');

    const hourListRef = useRef(null);
    const minuteListRef = useRef(null);
    const meridiemListRef = useRef(null);

    useEffect(() => {
        if (!selectedTime) {
            setHour(10);
            setMinute('00');
            setMeridiem('AM');
            setMessage('');
            return;
        }

        const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
            let [, hours, minutes, period] = match;
            setHour(Number(hours));
            setMinute(minutes);
            setMeridiem(period.toUpperCase());
        }
    }, [selectedTime]);

    useEffect(() => {
        if (!disablePastForToday || !selectedDate) {
            setMessage('');
            return;
        }

        const today = new Date();
        const selectedDay = new Date(`${selectedDate}T00:00:00`);
        if (selectedDay.toDateString() !== today.toDateString()) {
            setMessage('');
            return;
        }

        const currentMinutes = today.getHours() * 60 + today.getMinutes();
        const candidate = parseTimeToMinutes(formatTime(hour, minute, meridiem));
        if (candidate !== null && candidate <= currentMinutes) {
            setMessage('Please choose a future time');
        } else {
            setMessage('');
        }
    }, [disablePastForToday, selectedDate, hour, minute, meridiem]);

    const currentTimeValue = useMemo(() => `${hour}:${minute} ${meridiem}`, [hour, minute, meridiem]);

    const handleSetTime = () => {
        if (disablePastForToday && selectedDate) {
            const now = new Date();
            const selectedDay = new Date(`${selectedDate}T00:00:00`);
            if (selectedDay.toDateString() === now.toDateString()) {
                const candidate = parseTimeToMinutes(currentTimeValue);
                const currentTotal = now.getHours() * 60 + now.getMinutes();
                if (candidate !== null && candidate <= currentTotal) {
                    setMessage('Please choose a future time');
                    return;
                }
            }
        }

        onSelect(currentTimeValue);
        onClose();
    };

    const renderColumnItem = ({ item, isSelected }) => (
        <TouchableOpacity
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => {
                if (item === 'AM' || item === 'PM') {
                    setMeridiem(item);
                    return;
                }
                if (typeof item === 'number') setHour(item);
                else setMinute(item);
            }}
        >
            <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.sheet}>
                <View style={styles.handle} />

                <Text style={styles.preview}>{currentTimeValue}</Text>
                {message ? <Text style={styles.message}>{message}</Text> : null}

                <View style={styles.columns}>
                    <View style={styles.column}>
                        <FlatList
                            ref={hourListRef}
                            data={HOURS}
                            keyExtractor={(item) => `hour-${item}`}
                            showsVerticalScrollIndicator={false}
                            snapToAlignment="center"
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingVertical: 100 }}
                            onScrollToIndexFailed={() => {}}
                            renderItem={({ item }) => renderColumnItem({ item, isSelected: hour === item })}
                        />
                    </View>

                    <View style={styles.column}>
                        <FlatList
                            ref={minuteListRef}
                            data={MINUTES}
                            keyExtractor={(item) => `minute-${item}`}
                            showsVerticalScrollIndicator={false}
                            snapToAlignment="center"
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingVertical: 100 }}
                            renderItem={({ item }) => renderColumnItem({ item, isSelected: minute === item })}
                        />
                    </View>

                    <View style={styles.column}>
                        <FlatList
                            ref={meridiemListRef}
                            data={MERIDIEMS}
                            keyExtractor={(item) => `meridiem-${item}`}
                            showsVerticalScrollIndicator={false}
                            snapToAlignment="center"
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingVertical: 100 }}
                            renderItem={({ item }) => renderColumnItem({ item, isSelected: meridiem === item })}
                        />
                    </View>
                </View>

                <View style={styles.footerRow}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                        <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSetTime}>
                        <Text style={styles.primaryBtnText}>Set Time</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.28)' },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 20,
        maxHeight: '72%',
    },
    handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 12 },
    preview: { textAlign: 'center', fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
    message: { textAlign: 'center', color: '#EF4444', fontSize: 12, marginBottom: 8 },
    columns: { flexDirection: 'row', justifyContent: 'space-between', height: 260 },
    column: { flex: 1, alignItems: 'center' },
    item: { height: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
    itemSelected: { backgroundColor: '#EEF2FF', borderRadius: 10 },
    itemText: { fontSize: 18, color: '#111827', fontWeight: '700' },
    itemTextSelected: { color: '#5C8AF0' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    secondaryBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
    secondaryBtnText: { color: '#111827', fontWeight: '700', fontSize: 14 },
    primaryBtn: { flex: 1, backgroundColor: '#5C8AF0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginLeft: 8 },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
