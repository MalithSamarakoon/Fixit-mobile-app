import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatCurrency, getStockBadge } from '../hardwareShop/hardwareShopHelpers';
import { useCart } from '../../context/CartContext';

export default function HardwareProductDetailsScreen({ route, navigation }) {
    const initialProduct = route.params?.product;
    const productId = initialProduct?.id || route.params?.productId;

    const { cart, addToCart, cartCount } = useCart();

    const [product, setProduct] = useState(initialProduct || null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(!initialProduct);

    // Real-time product listener
    useEffect(() => {
        if (!productId) return;

        const unsubscribe = onSnapshot(
            doc(db, 'products', productId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setProduct({
                        ...initialProduct,
                        ...docSnap.data(),
                        id: docSnap.id,
                    });
                }
                setLoading(false);
            },
            (err) => {
                console.warn('Error fetching product detail:', err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [productId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#3B66FE" />
                </View>
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyTitle}>Product Not Found</Text>
                    <TouchableOpacity style={styles.backButtonSimple} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonSimpleText}>Back to Products</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const stock = Number(product.stock) || 0;
    const stockBadge = getStockBadge(stock);
    const isOutOfStock = stock <= 0;

    const handleIncrement = () => {
        if (quantity < stock) {
            setQuantity((q) => q + 1);
        } else {
            Alert.alert('Maximum Stock Reached', `Only ${stock} ${product.unit || 'pcs'} available.`);
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity((q) => q - 1);
        }
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
        Alert.alert(
            'Added to Cart',
            `${quantity} × ${product.name} added to your cart.`,
            [
                { text: 'Continue Shopping', style: 'cancel' },
                { text: 'View Cart', onPress: () => navigation.navigate('HardwareCart') },
            ]
        );
    };

    const handleBuyNow = () => {
        addToCart(product, quantity);
        navigation.navigate('HardwareCart');
    };

    const itemTotal = (Number(product.price) || 0) * quantity;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Product Details</Text>

                <TouchableOpacity
                    style={styles.cartHeaderBtn}
                    onPress={() => navigation.navigate('HardwareCart')}
                >
                    <Ionicons name="cart" size={22} color="#3B66FE" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Product Image */}
                <View style={styles.imageBox}>
                    {product.imageUri ? (
                        <Image source={{ uri: product.imageUri }} style={styles.image} resizeMode="contain" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="cube-outline" size={64} color="#3B66FE" />
                            <Text style={styles.placeholderText}>No Image Available</Text>
                        </View>
                    )}
                </View>

                {/* Main Info */}
                <View style={styles.infoCard}>
                    <View style={styles.badgesRow}>
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryPillText}>{product.category || 'General'}</Text>
                        </View>
                        <View style={[styles.stockPill, { backgroundColor: stockBadge.bg }]}>
                            <Text style={[styles.stockPillText, { color: stockBadge.color }]}>
                                {stockBadge.label}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.productName}>{product.name}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceText}>{formatCurrency(product.price)}</Text>
                        <Text style={styles.unitText}> / {product.unit || 'pcs'}</Text>
                    </View>
                </View>

                {/* Shop Partner Card */}
                <View style={styles.shopCard}>
                    <View style={styles.shopIconBox}>
                        <Ionicons name="storefront" size={22} color="#3B66FE" />
                    </View>
                    <View style={styles.shopInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.shopName}>{product.shopName || 'FixIt Hardware Partner'}</Text>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        </View>
                        <Text style={styles.shopLocation}>
                            <Ionicons name="location-outline" size={12} color="#6B7280" /> {product.shopLocation || 'Colombo Hardware Network'}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.descSection}>
                    <Text style={styles.descHeader}>Description & Specifications</Text>
                    <Text style={styles.descText}>
                        {product.description || 'Quality hardware supplies verified by our registered merchant.'}
                    </Text>
                </View>

                {/* Quantity Stepper (if in stock) */}
                {!isOutOfStock && (
                    <View style={styles.quantitySection}>
                        <View>
                            <Text style={styles.quantityLabel}>Select Quantity</Text>
                            <Text style={styles.stockAvailableText}>{stock} {product.unit || 'pcs'} in stock</Text>
                        </View>

                        <View style={styles.stepperContainer}>
                            <TouchableOpacity
                                style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                                onPress={handleDecrement}
                                disabled={quantity <= 1}
                            >
                                <Ionicons name="remove" size={18} color={quantity <= 1 ? '#D1D5DB' : '#1E2022'} />
                            </TouchableOpacity>

                            <Text style={styles.quantityNumber}>{quantity}</Text>

                            <TouchableOpacity
                                style={[styles.stepperBtn, quantity >= stock && styles.stepperBtnDisabled]}
                                onPress={handleIncrement}
                                disabled={quantity >= stock}
                            >
                                <Ionicons name="add" size={18} color={quantity >= stock ? '#D1D5DB' : '#1E2022'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Total Preview */}
                {!isOutOfStock && (
                    <View style={styles.totalPreviewBox}>
                        <Text style={styles.totalPreviewLabel}>Order Subtotal</Text>
                        <Text style={styles.totalPreviewAmount}>{formatCurrency(itemTotal)}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Floating Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.addToCartButton, isOutOfStock && styles.buttonDisabled]}
                    onPress={handleAddToCart}
                    disabled={isOutOfStock}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cart-outline" size={20} color="#3B66FE" style={{ marginRight: 6 }} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.buyNowButton, isOutOfStock && styles.buttonDisabled]}
                    onPress={handleBuyNow}
                    disabled={isOutOfStock}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buyNowText}>{isOutOfStock ? 'Out of Stock' : 'Buy Now'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    cartHeaderBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    content: { padding: 20, paddingBottom: 100 },

    imageBox: {
        width: '100%',
        height: 240,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 16,
    },
    image: { width: '90%', height: '90%' },
    imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
    placeholderText: { marginTop: 8, fontSize: 12, color: '#A0A0A0' },

    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 14,
    },
    badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    categoryPill: { backgroundColor: '#EDF2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    categoryPillText: { color: '#3B66FE', fontSize: 11, fontWeight: 'bold' },
    stockPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    stockPillText: { fontSize: 11, fontWeight: 'bold' },
    productName: { fontSize: 19, fontWeight: 'bold', color: '#1E2022', marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline' },
    priceText: { fontSize: 22, fontWeight: '900', color: '#10B981' },
    unitText: { fontSize: 13, color: '#6B7280' },

    shopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 14,
    },
    shopIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    shopInfo: { flex: 1 },
    shopName: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },
    shopLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    descSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 14,
    },
    descHeader: { fontSize: 14, fontWeight: 'bold', color: '#1E2022', marginBottom: 8 },
    descText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },

    quantitySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 14,
    },
    quantityLabel: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },
    stockAvailableText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
    },
    stepperBtn: {
        width: 36,
        height: 36,
        backgroundColor: '#fff',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperBtnDisabled: { opacity: 0.4 },
    quantityNumber: { fontSize: 16, fontWeight: 'bold', color: '#1E2022', marginHorizontal: 16 },

    totalPreviewBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#EDF2FE',
        borderRadius: 14,
        padding: 14,
    },
    totalPreviewLabel: { fontSize: 13, color: '#3B66FE', fontWeight: 'bold' },
    totalPreviewAmount: { fontSize: 17, color: '#3B66FE', fontWeight: '900' },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 25,
        borderTopWidth: 1,
        borderTopColor: '#EEF2F6',
    },
    addToCartButton: {
        flex: 1,
        flexDirection: 'row',
        height: 48,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#3B66FE',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    addToCartText: { color: '#3B66FE', fontSize: 14, fontWeight: 'bold' },
    buyNowButton: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#3B66FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyNowText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    buttonDisabled: { opacity: 0.5 },

    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginBottom: 12 },
    backButtonSimple: {
        backgroundColor: '#3B66FE',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
    },
    backButtonSimpleText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
