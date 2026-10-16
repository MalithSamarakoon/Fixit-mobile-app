import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const startOfDay = (date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
};

const getMonthGrid = (monthDate) => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const grid = [];

    const firstWeekday = (start.getDay() + 6) % 7;
    const leading = firstWeekday;
    const totalCells = Math.ceil((leading + end.getDate()) / 7) * 7;

    for (let i = 0; i < totalCells; i += 1) {
        const date = new Date(start.getFullYear(), start.getMonth(), i - leading + 1);
        grid.push(date);
    }

    return grid;
};

export default function CalendarPickerModal({
    visible,
    selectedDate,
    onSelect,
    onClose,
    minDate,
    title = 'Select date',
}) {
    const [monthDate, setMonthDate] = useState(() => {
        if (selectedDate) {
            const date = new Date(`${selectedDate}T00:00:00`);
            return new Date(date.getFullYear(), date.getMonth(), 1);
        }
        return new Date();
    });
    const [internalSelected, setInternalSelected] = useState(selectedDate || null);

    useEffect(() => {
        if (selectedDate) {
            const next = new Date(`${selectedDate}T00:00:00`);
            setInternalSelected(selectedDate);
            setMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
        } else {
            setInternalSelected(null);
        }
    }, [selectedDate]);

    const monthTitle = useMemo(
        () => new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        [monthDate]
    );

    const todayKey = useMemo(() => toDateKey(new Date()), []);

    const onMonthChange = (direction) => {
        setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const renderDay = (date) => {
        const dateKey = toDateKey(date);
        const isCurrentMonth = date.getMonth() === monthDate.getMonth();
        const isToday = dateKey === todayKey;
        const isSelected = dateKey === internalSelected;
        const isBeforeMin = !!minDate && startOfDay(date) < startOfDay(new Date(`${minDate}T00:00:00`));

        return (
            <TouchableOpacity
                key={dateKey}
                style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                    !isCurrentMonth && styles.dayCellMuted,
                    isBeforeMin && styles.dayCellDisabled,
                ]}
                disabled={!isCurrentMonth || isBeforeMin}
                onPress={() => {
                    if (isBeforeMin) return;
                    setInternalSelected(dateKey);
                    onSelect(dateKey);
                }}
            >
                <Text
                    style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                        (!isCurrentMonth || isBeforeMin) && styles.dayTextMuted,
                    ]}
                >
                    {date.getDate()}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.sheet}>
                <View style={styles.handle} />

                <View style={styles.headerRow}>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={20} color="#111827" />
                    </TouchableOpacity>
                </View>

                <View style={styles.monthRow}>
                    <TouchableOpacity style={styles.navBtn} onPress={() => onMonthChange(-1)}>
                        <Ionicons name="chevron-back" size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>{monthTitle}</Text>
                    <TouchableOpacity style={styles.navBtn} onPress={() => onMonthChange(1)}>
                        <Ionicons name="chevron-forward" size={22} color="#111827" />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekdayRow}>
                    {WEEKDAYS.map((day) => (
                        <Text key={day} style={styles.weekdayText}>{day}</Text>
                    ))}
                </View>

                <View style={styles.grid}>{getMonthGrid(monthDate).map(renderDay)}</View>

                <View style={styles.footerRow}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setInternalSelected(null); onSelect(null); onClose(); }}>
                        <Text style={styles.secondaryBtnText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
                        <Text style={styles.primaryBtnText}>Done</Text>
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
    },
    handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: '#111827' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    navBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    monthTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
    weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    weekdayText: { width: '14.2%', textAlign: 'center', color: '#6B7280', fontSize: 12, fontWeight: '700' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 6,
    },
    dayCell: {
        width: '14.2%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 6,
    },
    dayCellSelected: { backgroundColor: '#5C8AF0' },
    dayCellToday: { borderWidth: 1, borderColor: '#5C8AF0' },
    dayCellMuted: { opacity: 0.35 },
    dayCellDisabled: { opacity: 0.25 },
    dayText: { fontSize: 13, color: '#111827', fontWeight: '700' },
    dayTextSelected: { color: '#fff' },
    dayTextToday: { color: '#5C8AF0' },
    dayTextMuted: { color: '#6B7280' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    secondaryBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
    secondaryBtnText: { color: '#111827', fontWeight: '700', fontSize: 14 },
    primaryBtn: { flex: 1, backgroundColor: '#5C8AF0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginLeft: 8 },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
