import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function toDateString(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format a Date object or YYYY-MM-DD string to friendly string: 'Nov 30, 2026'
 */
export function toFriendlyDateString(val) {
    if (!val) return '';
    let d;
    if (typeof val === 'string') {
        const parts = val.split('-');
        if (parts.length === 3) {
            d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
            d = new Date(val);
        }
    } else {
        d = val;
    }
    if (!(d instanceof Date) || isNaN(d.getTime())) return String(val);

    const m = MONTH_NAMES[d.getMonth()]?.slice(0, 3);
    const day = d.getDate();
    const year = d.getFullYear();
    return `${m} ${day}, ${year}`;
}

/**
 * Parse date safely into Date object at midnight local time
 */
export function parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) {
        return new Date(val.getFullYear(), val.getMonth(), val.getDate());
    }
    if (typeof val === 'string') {
        const parts = val.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return new Date(y, m, d);
        }
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
    }
    return null;
}

export default function CalendarDatePickerModal({
    visible,
    onClose,
    onSelectDate,
    initialDate,
    minDate,
    maxDate,
    title = 'Select Date',
}) {
    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const minDateObj = useMemo(() => parseDate(minDate), [minDate]);
    const maxDateObj = useMemo(() => parseDate(maxDate), [maxDate]);

    // Active displayed Month and Year in calendar
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    // Currently selected date in calendar
    const [selectedDate, setSelectedDate] = useState(null);

    // Sync when modal opens
    useEffect(() => {
        if (visible) {
            const parsedInitial = parseDate(initialDate);
            if (parsedInitial && !isNaN(parsedInitial.getTime())) {
                setSelectedDate(parsedInitial);
                setViewYear(parsedInitial.getFullYear());
                setViewMonth(parsedInitial.getMonth());
            } else if (minDateObj && minDateObj > today) {
                setSelectedDate(minDateObj);
                setViewYear(minDateObj.getFullYear());
                setViewMonth(minDateObj.getMonth());
            } else {
                setSelectedDate(today);
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
            }
        }
    }, [visible, initialDate, minDateObj, today]);

    // Navigation
    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    // Calculate days grid for current viewMonth
    const calendarWeeks = useMemo(() => {
        const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
        const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        const weeks = [];
        let currentWeek = [];

        // Trailing days from previous month
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            currentWeek.push({
                day: d,
                isCurrentMonth: false,
                date: new Date(viewYear, viewMonth - 1, d),
            });
        }

        // Days of current month
        for (let d = 1; d <= daysInCurrentMonth; d++) {
            currentWeek.push({
                day: d,
                isCurrentMonth: true,
                date: new Date(viewYear, viewMonth, d),
            });

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Fill trailing days for next month to complete the row
        if (currentWeek.length > 0) {
            let nextDay = 1;
            while (currentWeek.length < 7) {
                currentWeek.push({
                    day: nextDay,
                    isCurrentMonth: false,
                    date: new Date(viewYear, viewMonth + 1, nextDay),
                });
                nextDay++;
            }
            weeks.push(currentWeek);
        }

        return weeks;
    }, [viewYear, viewMonth]);

    const isDateDisabled = (targetDate) => {
        if (!targetDate) return true;
        const targetTime = targetDate.getTime();
        if (minDateObj && targetTime < minDateObj.getTime()) return true;
        if (maxDateObj && targetTime > maxDateObj.getTime()) return true;
        return false;
    };

    const isDateSelected = (targetDate) => {
        if (!selectedDate || !targetDate) return false;
        return (
            selectedDate.getFullYear() === targetDate.getFullYear() &&
            selectedDate.getMonth() === targetDate.getMonth() &&
            selectedDate.getDate() === targetDate.getDate()
        );
    };

    const isDateToday = (targetDate) => {
        if (!targetDate) return false;
        return (
            today.getFullYear() === targetDate.getFullYear() &&
            today.getMonth() === targetDate.getMonth() &&
            today.getDate() === targetDate.getDate()
        );
    };

    const handleDayPress = (cell) => {
        if (isDateDisabled(cell.date)) return;
        setSelectedDate(cell.date);
        if (!cell.isCurrentMonth) {
            setViewYear(cell.date.getFullYear());
            setViewMonth(cell.date.getMonth());
        }
    };

    const handleConfirm = () => {
        if (!selectedDate || isDateDisabled(selectedDate)) return;
        const isoString = toDateString(selectedDate);
        const friendlyString = toFriendlyDateString(selectedDate);
        onSelectDate(isoString, friendlyString, selectedDate);
        onClose();
    };

    // Quick shortcut selection (+7 days, +30 days, etc.)
    const handleQuickSelect = (daysOffset) => {
        const base = minDateObj && minDateObj > today ? minDateObj : today;
        const target = new Date(base.getFullYear(), base.getMonth(), base.getDate() + daysOffset);
        if (!isDateDisabled(target)) {
            setSelectedDate(target);
            setViewYear(target.getFullYear());
            setViewMonth(target.getMonth());
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.titleText}>{title}</Text>
                            {selectedDate && (
                                <Text style={styles.selectedSubtitle}>
                                    {toFriendlyDateString(selectedDate)}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Quick Presets Row */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.presetsRow}
                    >
                        <TouchableOpacity
                            style={[styles.presetChip, (!minDateObj || today >= minDateObj) ? null : styles.presetDisabled]}
                            onPress={() => handleQuickSelect(0)}
                            disabled={Boolean(minDateObj && today < minDateObj)}
                        >
                            <Text style={styles.presetText}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetChip}
                            onPress={() => handleQuickSelect(1)}
                        >
                            <Text style={styles.presetText}>Tomorrow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetChip}
                            onPress={() => handleQuickSelect(7)}
                        >
                            <Text style={styles.presetText}>+1 Week</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetChip}
                            onPress={() => handleQuickSelect(14)}
                        >
                            <Text style={styles.presetText}>+2 Weeks</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.presetChip}
                            onPress={() => handleQuickSelect(30)}
                        >
                            <Text style={styles.presetText}>+1 Month</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Month Navigator Row */}
                    <View style={styles.monthNavRow}>
                        <TouchableOpacity
                            style={styles.navArrow}
                            onPress={handlePrevMonth}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chevron-back" size={20} color="#5C8AF0" />
                        </TouchableOpacity>

                        <Text style={styles.monthYearTitle}>
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </Text>

                        <TouchableOpacity
                            style={styles.navArrow}
                            onPress={handleNextMonth}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chevron-forward" size={20} color="#5C8AF0" />
                        </TouchableOpacity>
                    </View>

                    {/* Weekday Labels Header */}
                    <View style={styles.weekDaysHeader}>
                        {WEEK_DAYS.map((day, idx) => (
                            <Text key={idx} style={styles.weekDayLabel}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.daysGrid}>
                        {calendarWeeks.map((week, wIdx) => (
                            <View key={wIdx} style={styles.weekRow}>
                                {week.map((cell, cIdx) => {
                                    const disabled = isDateDisabled(cell.date);
                                    const selected = isDateSelected(cell.date);
                                    const isCurrentDay = isDateToday(cell.date);

                                    return (
                                        <TouchableOpacity
                                            key={cIdx}
                                            style={[
                                                styles.dayCell,
                                                selected && styles.dayCellSelected,
                                                isCurrentDay && !selected && styles.dayCellToday,
                                            ]}
                                            onPress={() => handleDayPress(cell)}
                                            disabled={disabled}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayNumberText,
                                                    !cell.isCurrentMonth && styles.dayOtherMonth,
                                                    disabled && styles.dayDisabledText,
                                                    selected && styles.daySelectedText,
                                                    isCurrentDay && !selected && styles.dayTodayText,
                                                ]}
                                            >
                                                {cell.day}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.cancelActionBtn} onPress={onClose}>
                            <Text style={styles.cancelActionText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmActionBtn,
                                (!selectedDate || isDateDisabled(selectedDate)) && styles.confirmDisabled,
                            ]}
                            onPress={handleConfirm}
                            disabled={!selectedDate || isDateDisabled(selectedDate)}
                        >
                            <Text style={styles.confirmActionText}>Set Date</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 10,
        marginBottom: 10,
    },
    titleText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    selectedSubtitle: { fontSize: 13, color: '#5C8AF0', fontWeight: '600', marginTop: 2 },
    closeBtn: { padding: 4 },

    presetsRow: { gap: 6, marginBottom: 14, paddingVertical: 2 },
    presetChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    presetDisabled: { opacity: 0.4 },
    presetText: { fontSize: 11, fontWeight: '600', color: '#5C8AF0' },

    monthNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FE',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    navArrow: { padding: 4 },
    monthYearTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },

    weekDaysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayLabel: {
        width: 38,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
    },

    daysGrid: { marginBottom: 14 },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 4,
    },
    dayCell: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCellSelected: {
        backgroundColor: '#5C8AF0',
    },
    dayCellToday: {
        borderWidth: 1.5,
        borderColor: '#5C8AF0',
    },
    dayNumberText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    dayOtherMonth: {
        color: '#D1D5DB',
    },
    dayDisabledText: {
        color: '#E5E7EB',
    },
    daySelectedText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dayTodayText: {
        color: '#5C8AF0',
        fontWeight: 'bold',
    },

    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    cancelActionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    cancelActionText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
    confirmActionBtn: {
        backgroundColor: '#5C8AF0',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    confirmDisabled: { opacity: 0.5 },
    confirmActionText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
