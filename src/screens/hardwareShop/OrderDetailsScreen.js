import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
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
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatCurrency, getOrderStatusStyle } from './hardwareShopHelpers';
import { addHardwareOrderNote, deleteHardwareOrder, updateHardwareOrderStatus } from './hardwareShopOrdersService';

const STATUS_STEPS = ['Pending', 'Confirmed', 'In Progress', 'Delivered'];

export default function OrderDetailsScreen({ route, navigation }) {
    const orderId = route?.params?.orderId || route?.params?.order?.id;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Notes state
    const [noteText, setNoteText] = useState('');
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [savingNote, setSavingNote] = useState(false);

    // Status Override Modal
    const [showStatusModal, setShowStatusModal] = useState(false);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return undefined;
        }

        const unsubscribe = onSnapshot(
            doc(db, 'hardwareOrders', orderId),
            (snap) => {
                if (snap.exists()) {
                    const data = { id: snap.id, ...snap.data() };
                    setOrder(data);
                    setNoteText(data.shopNotes || '');
                } else {
                    setOrder(null);
                }
                setLoading(false);
            },
            (error) => {
                console.warn('Order listener error:', error.message);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [orderId]);

    const handleUpdateStatus = async (newStatus) => {
        if (!orderId || updating) return;

        if (newStatus === 'Rejected') {
            Alert.alert(
                'Reject Order',
                `Are you sure you want to reject order ${order.orderNumber || order.id}? The customer will be informed.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Reject Order',
                        style: 'destructive',
                        onPress: async () => {
                            setUpdating(true);
                            try {
                                await updateHardwareOrderStatus(orderId, 'Rejected');
                                Alert.alert('Order Rejected', 'Order status updated to Rejected.');
                            } catch (error) {
                                Alert.alert('Error', error.message || 'Could not update order status.');
                            } finally {
                                setUpdating(false);
                            }
                        },
                    },
                ]
            );
            return;
        }

        setUpdating(true);
        try {
            await updateHardwareOrderStatus(orderId, newStatus);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not update order status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNote = async () => {
        if (!orderId) return;
        setSavingNote(true);
        try {
            await addHardwareOrderNote(orderId, noteText.trim());
            setIsEditingNote(false);
            Alert.alert('Success', 'Shop internal note saved.');
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save note.');
        } finally {
            setSavingNote(false);
        }
    };

    const handleCallCustomer = () => {
        if (!order?.customerPhone) {
            Alert.alert('Notice', 'No customer phone number available.');
            return;
        }
        const cleaned = order.customerPhone.replace(/[\s-]/g, '');
        Linking.openURL(`tel:${cleaned}`).catch(() => {
            Alert.alert('Error', 'Unable to initiate phone call.');
        });
    };

    const handleEmailCustomer = () => {
        if (!order?.customerEmail) {
            Alert.alert('Notice', 'No customer email available.');
            return;
        }
        Linking.openURL(`mailto:${order.customerEmail}?subject=Regarding Order ${order.orderNumber || order.id}`).catch(() => {
            Alert.alert('Error', 'Unable to open mail client.');
        });
    };

    const handleDeleteOrder = () => {
        Alert.alert(
            'Delete Order',
            `Are you sure you want to delete order record ${order.orderNumber || order.id}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteHardwareOrder(order.id);
                            Alert.alert('Deleted', 'Order record has been removed.', [
                                { text: 'OK', onPress: () => navigation.goBack() },
                            ]);
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Could not delete order.');
                        }
                    },
                },
            ]
        );
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

    if (!order) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyTitle}>Order Not Found</Text>
                    <Text style={styles.emptySub}>This order may have been deleted or the link is invalid.</Text>
                    <TouchableOpacity style={styles.backToListBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backToListBtnText}>Back to Orders</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusStyle = getOrderStatusStyle(order.status);
    const items = order.items || [];
    const currentStepIndex = STATUS_STEPS.indexOf(order.status);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{order.orderNumber || order.id}</Text>
                <TouchableOpacity
                    style={styles.moreIconBtn}
                    onPress={() => setShowStatusModal(true)}
                >
                    <Ionicons name="options-outline" size={20} color="#5C8AF0" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Status Hero Card */}
                <View style={styles.statusHeroCard}>
                    <View style={styles.statusTitleRow}>
                        <View>
                            <Text style={styles.orderTaskTitle}>{order.task || 'Hardware Supply'}</Text>
                            <Text style={styles.orderTimeText}>{order.time || 'Placed recently'}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: statusStyle.statusBg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.statusColor }]}>
                                {order.status}
                            </Text>
                        </View>
                    </View>

                    {/* Progress Stepper */}
                    {order.status === 'Rejected' ? (
                        <View style={styles.rejectedBanner}>
                            <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                            <Text style={styles.rejectedBannerText}>This order was declined or rejected.</Text>
                        </View>
                    ) : (
                        <View style={styles.stepperContainer}>
                            {STATUS_STEPS.map((step, idx) => {
                                const isPassed = currentStepIndex >= idx;
                                const isCurrent = currentStepIndex === idx;
                                return (
                                    <View key={step} style={styles.stepItem}>
                                        <View
                                            style={[
                                                styles.stepCircle,
                                                isPassed && styles.stepCirclePassed,
                                                isCurrent && styles.stepCircleCurrent,
                                            ]}
                                        >
                                            {isPassed ? (
                                                <Ionicons name="checkmark" size={12} color="#fff" />
                                            ) : (
                                                <Text style={styles.stepNumber}>{idx + 1}</Text>
                                            )}
                                        </View>
                                        <Text
                                            style={[
                                                styles.stepLabel,
                                                isPassed && styles.stepLabelPassed,
                                                isCurrent && styles.stepLabelCurrent,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {step}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Workflow Action Buttons */}
                <View style={styles.actionSection}>
                    {updating && (
                        <View style={styles.updatingIndicator}>
                            <ActivityIndicator size="small" color="#5C8AF0" />
                            <Text style={styles.updatingText}>Updating order status...</Text>
                        </View>
                    )}

                    {order.status === 'Pending' && (
                        <View style={styles.twoBtnRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.confirmBtn]}
                                onPress={() => handleUpdateStatus('Confirmed')}
                                disabled={updating}
                            >
                                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.actionBtnText}>Confirm Order</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => handleUpdateStatus('Rejected')}
                                disabled={updating}
                            >
                                <Ionicons name="close-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.actionBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {order.status === 'Confirmed' && (
                        <View style={styles.twoBtnRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.processBtn]}
                                onPress={() => handleUpdateStatus('In Progress')}
                                disabled={updating}
                            >
                                <Ionicons name="construct-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.actionBtnText}>Start Processing</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => handleUpdateStatus('Rejected')}
                                disabled={updating}
                            >
                                <Ionicons name="close-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.actionBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {order.status === 'In Progress' && (
                        <TouchableOpacity
                            style={[styles.fullActionBtn, styles.deliverBtn]}
                            onPress={() => handleUpdateStatus('Delivered')}
                            disabled={updating}
                        >
                            <Ionicons name="bicycle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.fullActionBtnText}>Mark as Delivered</Text>
                        </TouchableOpacity>
                    )}

                    {order.status === 'Delivered' && (
                        <View style={styles.completedAlertBox}>
                            <Ionicons name="checkmark-done-circle" size={24} color="#10B981" style={{ marginRight: 8 }} />
                            <Text style={styles.completedAlertText}>Order successfully delivered and completed.</Text>
                        </View>
                    )}
                </View>

                {/* Customer Information Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Customer Information</Text>
                    <View style={styles.customerTopRow}>
                        <View style={styles.customerAvatar}>
                            <Text style={styles.customerAvatarText}>
                                {(order.customerName || 'C').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.customerDetails}>
                            <Text style={styles.customerNameMain}>{order.customerName || 'Anonymous Customer'}</Text>
                            <Text style={styles.customerPhoneText}>{order.customerPhone || 'No phone provided'}</Text>
                        </View>
                    </View>

                    <View style={styles.quickContactRow}>
                        <TouchableOpacity
                            style={[styles.contactPill, !order.customerPhone && styles.disabledPill]}
                            onPress={handleCallCustomer}
                            disabled={!order.customerPhone}
                        >
                            <Ionicons name="call" size={15} color="#5C8AF0" style={{ marginRight: 6 }} />
                            <Text style={styles.contactPillText}>Call Customer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.contactPill, !order.customerEmail && styles.disabledPill]}
                            onPress={handleEmailCustomer}
                            disabled={!order.customerEmail}
                        >
                            <Ionicons name="mail" size={15} color="#5C8AF0" style={{ marginRight: 6 }} />
                            <Text style={styles.contactPillText}>Send Email</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.specDivider} />

                    <View style={styles.locationWrap}>
                        <Ionicons name="location-outline" size={18} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.locationTitle}>Delivery Address</Text>
                            <Text style={styles.locationText}>
                                {order.deliveryLocation || 'In-store Pickup'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Items Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Order Items ({items.length})</Text>

                    {items.map((item, index) => {
                        const itemQty = item.qty || 1;
                        const itemPrice = Number(item.price || 0);
                        const itemSubtotal = itemQty * itemPrice;
                        return (
                            <View key={`${item.name}-${index}`} style={styles.itemRow}>
                                <View style={styles.itemQtyBadge}>
                                    <Text style={styles.itemQtyText}>{itemQty}x</Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemUnitPricing}>{formatCurrency(itemPrice)} each</Text>
                                </View>
                                <Text style={styles.itemSubtotal}>{formatCurrency(itemSubtotal)}</Text>
                            </View>
                        );
                    })}

                    <View style={styles.totalDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(order.total)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={[styles.summaryValue, { color: '#10B981' }]}>Free</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 8 }]}>
                        <Text style={styles.grandTotalLabel}>Total Paid</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(order.total)}</Text>
                    </View>
                </View>

                {/* Internal Notes Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Shop Notes (Internal)</Text>
                        <TouchableOpacity
                            onPress={() => setIsEditingNote(!isEditingNote)}
                        >
                            <Text style={styles.editNoteLink}>
                                {isEditingNote ? 'Cancel' : (order.shopNotes ? 'Edit Note' : '+ Add Note')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isEditingNote ? (
                        <View style={styles.noteEditBox}>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Add notes (e.g. Courier tracking #, driver name, special packaging)..."
                                placeholderTextColor="#A0A0A0"
                                multiline
                                numberOfLines={3}
                                value={noteText}
                                onChangeText={setNoteText}
                            />
                            <TouchableOpacity
                                style={styles.saveNoteBtn}
                                onPress={handleSaveNote}
                                disabled={savingNote}
                            >
                                {savingNote ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveNoteBtnText}>Save Note</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.noteDisplayText}>
                            {order.shopNotes?.trim()
                                ? order.shopNotes
                                : 'No internal notes saved for this order yet.'}
                        </Text>
                    )}
                </View>

                {/* Delete Order Action */}
                <TouchableOpacity
                    style={styles.deleteOrderBtn}
                    onPress={handleDeleteOrder}
                >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteOrderBtnText}>Delete Order Record</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Manual Status Override Modal */}
            <Modal
                visible={showStatusModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStatusModal(false)}
            >
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Set Order Status</Text>
                            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {['Pending', 'Confirmed', 'In Progress', 'Delivered', 'Rejected'].map((status) => {
                            const isCurrent = order.status === status;
                            return (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.statusOptionItem,
                                        isCurrent && styles.statusOptionItemSelected,
                                    ]}
                                    onPress={() => {
                                        setShowStatusModal(false);
                                        handleUpdateStatus(status);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.statusOptionText,
                                            isCurrent && styles.statusOptionTextSelected,
                                        ]}
                                    >
                                        {status}
                                    </Text>
                                    {isCurrent && (
                                        <Ionicons name="checkmark-circle" size={20} color="#5C8AF0" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    moreIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
    },

    container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 14 },

    statusHeroCard: {
        backgroundColor: '#F8F9FE',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 16,
    },
    statusTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    orderTaskTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    orderTimeText: { fontSize: 12, color: '#6B7280' },
    statusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: 'bold' },

    rejectedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 10,
        borderRadius: 10,
    },
    rejectedBannerText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 6,
    },
    stepItem: { alignItems: 'center', flex: 1 },
    stepCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    stepCirclePassed: { backgroundColor: '#10B981' },
    stepCircleCurrent: { backgroundColor: '#5C8AF0' },
    stepNumber: { fontSize: 11, color: '#6B7280', fontWeight: 'bold' },
    stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
    stepLabelPassed: { color: '#10B981', fontWeight: '600' },
    stepLabelCurrent: { color: '#5C8AF0', fontWeight: 'bold' },

    actionSection: { marginBottom: 16 },
    updatingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    updatingText: { fontSize: 13, color: '#5C8AF0', marginLeft: 6, fontWeight: '600' },

    twoBtnRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtn: { backgroundColor: '#10B981' },
    rejectBtn: { backgroundColor: '#EF4444' },
    processBtn: { backgroundColor: '#F59E0B' },
    deliverBtn: { backgroundColor: '#5C8AF0' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    fullActionBtn: {
        flexDirection: 'row',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullActionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    completedAlertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    completedAlertText: { color: '#065F46', fontSize: 14, fontWeight: '600' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 14 },

    customerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    customerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#5C8AF0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    customerAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    customerDetails: { flex: 1 },
    customerNameMain: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    customerPhoneText: { fontSize: 13, color: '#6B7280' },

    quickContactRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    contactPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EDF2FE',
        paddingVertical: 10,
        borderRadius: 10,
    },
    disabledPill: { opacity: 0.5 },
    contactPillText: { color: '#5C8AF0', fontSize: 12, fontWeight: 'bold' },

    specDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

    locationWrap: { flexDirection: 'row', alignItems: 'flex-start' },
    locationTitle: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
    locationText: { fontSize: 14, color: '#374151', lineHeight: 20 },

    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemQtyBadge: {
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    itemQtyText: { color: '#5C8AF0', fontWeight: 'bold', fontSize: 12 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
    itemUnitPricing: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    itemSubtotal: { fontSize: 14, fontWeight: 'bold', color: '#111827' },

    totalDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    summaryLabel: { fontSize: 13, color: '#6B7280' },
    summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
    grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    grandTotalValue: { fontSize: 18, fontWeight: '900', color: '#5C8AF0' },

    editNoteLink: { color: '#5C8AF0', fontSize: 13, fontWeight: '600' },
    noteDisplayText: { fontSize: 14, color: '#4B5563', lineHeight: 20, fontStyle: 'italic' },
    noteEditBox: { marginTop: 4 },
    noteInput: {
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        textAlignVertical: 'top',
        minHeight: 80,
        marginBottom: 10,
    },
    saveNoteBtn: {
        backgroundColor: '#5C8AF0',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveNoteBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

    deleteOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    deleteOrderBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
    emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
    backToListBtn: { backgroundColor: '#5C8AF0', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    backToListBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 340,
        borderRadius: 18,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 10,
    },
    modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
    statusOptionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    statusOptionItemSelected: { backgroundColor: '#EDF2FE' },
    statusOptionText: { fontSize: 14, color: '#374151' },
    statusOptionTextSelected: { color: '#5C8AF0', fontWeight: 'bold' },
});
