import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
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
import { formatCurrency } from '../hardwareShop/hardwareShopHelpers';
import { adjustProductStock } from '../hardwareShop/hardwareShopProductService';
import { useCart } from '../../context/CartContext';

const STANDARD_DELIVERY_FEE = 350;

export default function HardwareCartScreen({ route, navigation }) {
    const { cart, updateCartQty, removeFromCart, clearCart, cartSubtotal } = useCart();

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const [notes, setNotes] = useState('');

    // Promo code state
    const [promoInput, setPromoInput] = useState(route.params?.applyCode || '');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [availableDiscounts, setAvailableDiscounts] = useState([]);
    const [checkingDiscount, setCheckingDiscount] = useState(false);

    // Form errors & loading
    const [errors, setErrors] = useState({});
    const [placingOrder, setPlacingOrder] = useState(false);

    // Prefill customer details from Firestore
    useEffect(() => {
        const fetchUserData = async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setCustomerName(data.username || data.name || '');
                    setCustomerPhone(data.mobile || data.phone || '');
                    setCustomerEmail(data.email || auth.currentUser.email || '');
                    setDeliveryLocation(data.location || data.address || '');
                }
            } catch (err) {
                console.warn('Error fetching customer profile:', err.message);
            }
        };

        const fetchAvailableDiscounts = async () => {
            try {
                const snap = await getDocs(collection(db, 'hardwareDiscounts'));
                const today = new Date().toISOString().split('T')[0];
                const list = [];
                snap.forEach((d) => {
                    const data = { id: d.id, ...d.data() };
                    const isOngoing = data.status === 'ONGOING' || !data.status;
                    const notExpired = !data.validity || data.validity >= today;
                    if (isOngoing && notExpired) {
                        list.push(data);
                    }
                });
                setAvailableDiscounts(list);

                // Auto-apply promo from navigation params if provided
                if (route.params?.applyCode) {
                    const match = list.find(
                        (disc) => disc.code?.toUpperCase() === route.params.applyCode.trim().toUpperCase()
                    );
                    if (match) {
                        setAppliedDiscount(match);
                    }
                }
            } catch (err) {
                console.warn('Error fetching discounts:', err.message);
            }
        };

        fetchUserData();
        fetchAvailableDiscounts();
    }, [route.params?.applyCode]);

    // Calculate Discount Amount
    const discountAmount = React.useMemo(() => {
        if (!appliedDiscount || cartSubtotal <= 0) return 0;
        const valStr = String(appliedDiscount.discountValue || '');
        if (valStr.includes('%')) {
            const num = parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0;
            return Math.round((cartSubtotal * num) / 100);
        } else {
            const num = parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0;
            return Math.min(cartSubtotal, num);
        }
    }, [appliedDiscount, cartSubtotal]);

    const deliveryFee = cart.length > 0 ? STANDARD_DELIVERY_FEE : 0;
    const finalTotal = Math.max(0, cartSubtotal - discountAmount) + deliveryFee;

    const handleApplyPromo = (codeToApply) => {
        Keyboard.dismiss();
        const code = (codeToApply || promoInput).trim().toUpperCase();
        if (!code) {
            Alert.alert('Notice', 'Please enter a coupon code.');
            return;
        }

        setCheckingDiscount(true);
        const today = new Date().toISOString().split('T')[0];
        const match = availableDiscounts.find((d) => (d.code || '').toUpperCase() === code);

        if (!match) {
            Alert.alert('Invalid Coupon', `Promo code "${code}" is not valid or has expired.`);
            setCheckingDiscount(false);
            return;
        }

        if (match.validity && match.validity < today) {
            Alert.alert('Expired Coupon', `Promo code "${code}" expired on ${match.validity}.`);
            setCheckingDiscount(false);
            return;
        }

        setAppliedDiscount(match);
        setPromoInput(code);
        setCheckingDiscount(false);
        Alert.alert('Success', `Coupon "${code}" (${match.discountValue}) applied successfully!`);
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setPromoInput('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!customerName.trim()) newErrors.customerName = 'Please enter your name.';
        if (!customerPhone.trim()) {
            newErrors.customerPhone = 'Phone number is required.';
        } else if (!/^\d{10}$/.test(customerPhone.trim())) {
            newErrors.customerPhone = 'Phone number must contain exactly 10 digits.';
        }
        if (!deliveryLocation.trim()) {
            newErrors.deliveryLocation = 'Please provide delivery address / city.';
        }
        if (cart.length === 0) {
            Alert.alert('Cart is Empty', 'Please add products before checking out.');
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePlaceOrder = async () => {
        Keyboard.dismiss();
        if (!validateForm()) return;

        setPlacingOrder(true);
        try {
            const now = new Date();
            const timeString = now.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            // Group cart items by shopOwnerId so each shop owner receives their specific order
            const ordersByShop = {};
            cart.forEach((item) => {
                const sId = item.shopOwnerId || 'unassigned';
                if (!ordersByShop[sId]) ordersByShop[sId] = [];
                ordersByShop[sId].push(item);
            });

            const createdOrderNumbers = [];

            for (const [shopOwnerId, itemsForShop] of Object.entries(ordersByShop)) {
                const shopSubtotal = itemsForShop.reduce((sum, it) => sum + it.price * it.qty, 0);
                // Allocate proportional discount
                const shopDiscount = appliedDiscount ? Math.min(shopSubtotal, discountAmount) : 0;
                const shopTotal = Math.max(0, shopSubtotal - shopDiscount) + STANDARD_DELIVERY_FEE;
                const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
                createdOrderNumbers.push(orderNumber);

                await addDoc(collection(db, 'hardwareOrders'), {
                    orderNumber,
                    task: `Hardware Supplies Order (${itemsForShop.length} ${itemsForShop.length === 1 ? 'item' : 'items'})`,
                    time: timeString,
                    status: 'Pending',
                    icon: 'construct-outline',
                    customerName: customerName.trim(),
                    customerPhone: customerPhone.trim(),
                    customerEmail: customerEmail.trim(),
                    deliveryLocation: deliveryLocation.trim(),
                    customerNotes: notes.trim(),
                    items: itemsForShop.map((it) => ({
                        id: it.id,
                        name: it.name,
                        qty: it.qty,
                        price: it.price,
                        unit: it.unit || 'pcs',
                    })),
                    subtotal: shopSubtotal,
                    discount: shopDiscount,
                    discountCode: appliedDiscount?.code || '',
                    deliveryFee: STANDARD_DELIVERY_FEE,
                    total: shopTotal,
                    shopOwnerId: shopOwnerId === 'unassigned' ? null : shopOwnerId,
                    houseOwnerId: auth.currentUser?.uid || null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                // Update real product stock in Firestore
                for (const it of itemsForShop) {
                    if (it.id) {
                        adjustProductStock(it.id, it.stock, -it.qty).catch((e) =>
                            console.warn('Stock decrement error:', e)
                        );
                    }
                }
            }

            clearCart();
            Alert.alert(
                'Order Placed Successfully!',
                `Your order (${createdOrderNumbers.join(', ')}) has been submitted to the Hardware Shop Owner.\nTotal: ${formatCurrency(finalTotal)}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('HomeScreen'),
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Order Placement Failed', error.message || 'An error occurred while creating your order.');
        } finally {
            setPlacingOrder(false);
        }
    };

    if (cart.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color="#1E2022" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shopping Cart</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="cart-outline" size={54} color="#5C8AF0" />
                    </View>
                    <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
                    <Text style={styles.emptySub}>Browse hardware products, tools, and supplies to add items to your cart.</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.browseBtnText}>Browse Hardware Products</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout & Cart ({cart.length})</Text>
                <TouchableOpacity onPress={clearCart} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Cart Items List */}
                <Text style={styles.sectionHeader}>Selected Products</Text>
                {cart.map((item) => (
                    <View key={item.id} style={styles.cartItemCard}>
                        {item.imageUri ? (
                            <Image source={{ uri: item.imageUri }} style={styles.itemImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.itemImagePlaceholder}>
                                <Ionicons name="cube-outline" size={24} color="#3B66FE" />
                            </View>
                        )}

                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemShopName} numberOfLines={1}>
                                <Ionicons name="storefront-outline" size={11} color="#6B7280" /> {item.shopName}
                            </Text>
                            <Text style={styles.itemPrice}>{formatCurrency(item.price)} / {item.unit || 'pcs'}</Text>
                        </View>

                        {/* Stepper & Delete */}
                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => removeFromCart(item.id)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>

                            <View style={styles.stepperBox}>
                                <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => updateCartQty(item.id, item.qty - 1)}
                                >
                                    <Ionicons name="remove" size={14} color="#1E2022" />
                                </TouchableOpacity>
                                <Text style={styles.stepperQty}>{item.qty}</Text>
                                <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => updateCartQty(item.id, item.qty + 1)}
                                >
                                    <Ionicons name="add" size={14} color="#1E2022" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Available Promo Codes Carousel */}
                {availableDiscounts.length > 0 && (
                    <View style={styles.suggestedPromosSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Ionicons name="pricetag" size={15} color="#10B981" />
                            <Text style={styles.promoHeaderTitle}>Available Merchant Coupons</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {availableDiscounts.map((d) => (
                                <TouchableOpacity
                                    key={d.id}
                                    style={[
                                        styles.couponChip,
                                        appliedDiscount?.id === d.id && styles.couponChipActive,
                                    ]}
                                    onPress={() => handleApplyPromo(d.code)}
                                >
                                    <Text style={[styles.couponChipCode, appliedDiscount?.id === d.id && { color: '#fff' }]}>
                                        {d.code}
                                    </Text>
                                    <Text style={[styles.couponChipValue, appliedDiscount?.id === d.id && { color: '#E0E7FF' }]}>
                                        {d.discountValue}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Promo Code Input Box */}
                <View style={styles.promoBox}>
                    <Text style={styles.sectionHeader}>Apply Promo Code</Text>
                    {appliedDiscount ? (
                        <View style={styles.appliedPromoBadge}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <View>
                                    <Text style={styles.appliedPromoText}>Coupon "{appliedDiscount.code}" applied</Text>
                                    <Text style={styles.appliedPromoSub}>{appliedDiscount.discountValue} saving</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleRemoveDiscount}>
                                <Text style={styles.removePromoText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.promoInputRow}>
                            <TextInput
                                style={styles.promoInput}
                                placeholder="Enter promo code (e.g. SAVE15)"
                                placeholderTextColor="#A0A0A0"
                                value={promoInput}
                                onChangeText={setPromoInput}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => handleApplyPromo()}
                                disabled={checkingDiscount}
                            >
                                {checkingDiscount ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.applyBtnText}>Apply</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Customer & Delivery Information */}
                <View style={styles.deliverySection}>
                    <Text style={styles.sectionHeader}>Delivery Information</Text>

                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={[styles.input, errors.customerName && styles.inputError]}
                        value={customerName}
                        onChangeText={(t) => {
                            setCustomerName(t);
                            if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                        }}
                        placeholder="e.g. Kamal Perera"
                        placeholderTextColor="#A0A0A0"
                        editable={!placingOrder}
                    />
                    {errors.customerName ? <Text style={styles.errorText}>{errors.customerName}</Text> : null}

                    <Text style={styles.inputLabel}>Contact Phone (10 digits)</Text>
                    <TextInput
                        style={[styles.input, errors.customerPhone && styles.inputError]}
                        value={customerPhone}
                        onChangeText={(t) => {
                            const cleaned = t.replace(/\D/g, '').slice(0, 10);
                            setCustomerPhone(cleaned);
                            if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: '' }));
                        }}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholder="e.g. 0712345678"
                        placeholderTextColor="#A0A0A0"
                        editable={!placingOrder}
                    />
                    {errors.customerPhone ? <Text style={styles.errorText}>{errors.customerPhone}</Text> : null}

                    <Text style={styles.inputLabel}>Delivery Address / Location</Text>
                    <TextInput
                        style={[styles.input, errors.deliveryLocation && styles.inputError]}
                        value={deliveryLocation}
                        onChangeText={(t) => {
                            setDeliveryLocation(t);
                            if (errors.deliveryLocation) setErrors((prev) => ({ ...prev, deliveryLocation: '' }));
                        }}
                        placeholder="e.g. No 45, Galle Road, Colombo 03"
                        placeholderTextColor="#A0A0A0"
                        editable={!placingOrder}
                    />
                    {errors.deliveryLocation ? <Text style={styles.errorText}>{errors.deliveryLocation}</Text> : null}

                    <Text style={styles.inputLabel}>Special Instructions (Optional)</Text>
                    <TextInput
                        style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="e.g. Please call before arrival or deliver near back gate"
                        placeholderTextColor="#A0A0A0"
                        multiline
                        editable={!placingOrder}
                    />
                </View>

                {/* Price Breakdown */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Order Summary</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(cartSubtotal)}</Text>
                    </View>

                    {discountAmount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: '#10B981' }]}>
                                Discount ({appliedDiscount?.code})
                            </Text>
                            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                                - {formatCurrency(discountAmount)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(deliveryFee)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>{formatCurrency(finalTotal)}</Text>
                    </View>
                </View>

                {/* Submit Order Button */}
                <TouchableOpacity
                    style={[styles.placeOrderBtn, placingOrder && styles.btnDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={placingOrder}
                    activeOpacity={0.8}
                >
                    {placingOrder ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="bag-check" size={20} color="#fff" />
                            <Text style={styles.placeOrderBtnText}>Place Order • {formatCurrency(finalTotal)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    clearText: { color: '#EF4444', fontSize: 13, fontWeight: 'bold' },

    content: { padding: 20, paddingBottom: 50 },

    sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#1E2022', marginBottom: 10 },

    // Cart Item
    cartItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    itemImage: { width: 65, height: 65, borderRadius: 10 },
    itemImagePlaceholder: {
        width: 65,
        height: 65,
        borderRadius: 10,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: { flex: 1, marginLeft: 12 },
    itemName: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },
    itemShopName: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    itemPrice: { fontSize: 13, fontWeight: 'bold', color: '#10B981', marginTop: 4 },

    itemActions: { alignItems: 'flex-end', justifyContent: 'space-between', height: 65 },
    deleteBtn: { padding: 4 },
    stepperBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
    },
    stepperBtn: {
        width: 24,
        height: 24,
        backgroundColor: '#fff',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperQty: { fontSize: 13, fontWeight: 'bold', color: '#1E2022', marginHorizontal: 8 },

    // Suggested Promo Chips
    suggestedPromosSection: { marginTop: 10, marginBottom: 15 },
    promoHeaderTitle: { fontSize: 13, fontWeight: 'bold', color: '#10B981' },
    couponChip: {
        backgroundColor: '#ECFDF5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    couponChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    couponChipCode: { fontSize: 13, fontWeight: '900', color: '#065F46' },
    couponChipValue: { fontSize: 10, color: '#047857', marginTop: 1 },

    // Promo box
    promoBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 16,
    },
    promoInputRow: { flexDirection: 'row', gap: 10 },
    promoInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 13,
        color: '#1E2022',
    },
    applyBtn: {
        backgroundColor: '#3B66FE',
        borderRadius: 12,
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    appliedPromoBadge: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    appliedPromoText: { fontSize: 13, fontWeight: 'bold', color: '#065F46' },
    appliedPromoSub: { fontSize: 11, color: '#047857' },
    removePromoText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },

    // Delivery Section
    deliverySection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 16,
    },
    inputLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 5, marginTop: 8 },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 13,
        color: '#1E2022',
    },
    inputError: { borderColor: '#EF4444' },
    errorText: { color: '#EF4444', fontSize: 11, marginTop: 3 },

    // Summary Card
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 20,
    },
    summaryTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E2022', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 13, color: '#6B7280' },
    summaryValue: { fontSize: 13, fontWeight: '600', color: '#1E2022' },
    divider: { height: 1, backgroundColor: '#EEF2F6', marginVertical: 10 },
    totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1E2022' },
    totalValue: { fontSize: 18, fontWeight: '900', color: '#3B66FE' },

    // Place Order Button
    placeOrderBtn: {
        backgroundColor: '#3B66FE',
        borderRadius: 16,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#3B66FE',
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    placeOrderBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    btnDisabled: { opacity: 0.6 },

    // Empty state
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E2022', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 25 },
    browseBtn: {
        backgroundColor: '#3B66FE',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 14,
    },
    browseBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
