import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { formatCurrency, getStockBadge } from './hardwareShopHelpers';
import { adjustProductStock, deleteProduct, updateProductStock } from './hardwareShopProductService';

export default function ProductDetailsScreen({ route, navigation }) {
    const initialProduct = route.params?.product;
    const productId = initialProduct?.id || route.params?.productId;

    const [product, setProduct] = useState(initialProduct || null);
    const [loading, setLoading] = useState(!initialProduct);
    const [updatingStock, setUpdatingStock] = useState(false);
    const [customStock, setCustomStock] = useState('');
    const [showStockInput, setShowStockInput] = useState(false);

    // Listen to real-time changes of this product
    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'products', productId), (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setProduct(data);
                setCustomStock(String(data.stock ?? 0));
            } else {
                setProduct(null);
            }
            setLoading(false);
        }, (error) => {
            console.warn('Failed to listen to product:', error.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [productId]);

    const handleAdjustStock = async (delta) => {
        if (!product || updatingStock) return;
        setUpdatingStock(true);
        try {
            await adjustProductStock(product.id, product.stock, delta);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update stock quantity.');
        } finally {
            setUpdatingStock(false);
        }
    };

    const handleSetCustomStock = async () => {
        const val = parseInt(customStock, 10);
        if (isNaN(val) || val < 0) {
            Alert.alert('Invalid Quantity', 'Please enter a valid non-negative whole number.');
            return;
        }
        setUpdatingStock(true);
        try {
            await updateProductStock(product.id, val);
            setShowStockInput(false);
            Alert.alert('Stock Updated', `Stock updated to ${val} ${product.unit || 'pcs'}.`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update stock.');
        } finally {
            setUpdatingStock(false);
        }
    };

    const handleDelete = () => {
        if (!product) return;
        Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProduct(product.id);
                            Alert.alert('Success', 'Product has been deleted.', [
                                { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to delete product.');
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

    if (!product) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Product Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyTitle}>Product Not Found</Text>
                    <Text style={styles.emptySub}>This product may have been removed or does not exist.</Text>
                    <TouchableOpacity style={styles.backToListBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backToListBtnText}>Back to Products</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const stockBadge = getStockBadge(product.stock);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => navigation.navigate('EditProduct', { product })}
                    >
                        <Ionicons name="create-outline" size={20} color="#5C8AF0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.headerIconBtn, { marginLeft: 8 }]}
                        onPress={handleDelete}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Hero / Media Card */}
                <View style={styles.heroCard}>
                    {product.imageUri ? (
                        <Image source={{ uri: product.imageUri }} style={styles.productImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="cube-outline" size={56} color="#5C8AF0" />
                            <Text style={styles.placeholderLabel}>Hardware Product</Text>
                        </View>
                    )}

                    <View style={styles.heroContent}>
                        <View style={styles.categoryRow}>
                            <View style={styles.categoryPill}>
                                <Text style={styles.categoryText}>{product.category || 'General'}</Text>
                            </View>
                            <View style={[styles.stockPill, { backgroundColor: stockBadge.bg }]}>
                                <Text style={[styles.stockText, { color: stockBadge.color }]}>
                                    {stockBadge.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                            <Text style={styles.priceUnit}> / {product.unit || 'pcs'}</Text>
                        </View>
                    </View>
                </View>

                {/* Inventory Management Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Inventory Management</Text>
                        {updatingStock && <ActivityIndicator size="small" color="#5C8AF0" />}
                    </View>

                    <View style={styles.stockStatusRow}>
                        <View>
                            <Text style={styles.stockLabel}>Available Stock</Text>
                            <Text style={styles.stockBigNumber}>
                                {product.stock} <Text style={styles.stockUnitSmall}>{product.unit || 'pcs'}</Text>
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.customStockToggle}
                            onPress={() => setShowStockInput(!showStockInput)}
                        >
                            <Ionicons name={showStockInput ? 'close' : 'create-outline'} size={16} color="#5C8AF0" style={{ marginRight: 4 }} />
                            <Text style={styles.customStockToggleText}>
                                {showStockInput ? 'Cancel' : 'Set Exact Stock'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showStockInput ? (
                        <View style={styles.exactStockBox}>
                            <Text style={styles.inputSubLabel}>Enter new stock count:</Text>
                            <View style={styles.inputActionRow}>
                                <TextInput
                                    style={styles.stockInput}
                                    keyboardType="numeric"
                                    value={customStock}
                                    onChangeText={setCustomStock}
                                    placeholder="0"
                                    placeholderTextColor="#A0A0A0"
                                />
                                <TouchableOpacity
                                    style={styles.saveStockBtn}
                                    onPress={handleSetCustomStock}
                                    disabled={updatingStock}
                                >
                                    <Text style={styles.saveStockBtnText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.quickAdjustRow}>
                            <Text style={styles.quickAdjustLabel}>Quick Adjustment:</Text>
                            <View style={styles.adjustBtns}>
                                <TouchableOpacity
                                    style={[styles.adjustBtn, styles.adjustMinus]}
                                    onPress={() => handleAdjustStock(-5)}
                                    disabled={updatingStock || product.stock <= 0}
                                >
                                    <Text style={styles.adjustMinusText}>-5</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.adjustBtn, styles.adjustMinus]}
                                    onPress={() => handleAdjustStock(-1)}
                                    disabled={updatingStock || product.stock <= 0}
                                >
                                    <Text style={styles.adjustMinusText}>-1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.adjustBtn, styles.adjustPlus]}
                                    onPress={() => handleAdjustStock(1)}
                                    disabled={updatingStock}
                                >
                                    <Text style={styles.adjustPlusText}>+1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.adjustBtn, styles.adjustPlus]}
                                    onPress={() => handleAdjustStock(5)}
                                    disabled={updatingStock}
                                >
                                    <Text style={styles.adjustPlusText}>+5</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Product Specifications */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Specifications</Text>
                    <View style={styles.specRow}>
                        <Text style={styles.specKey}>Category</Text>
                        <Text style={styles.specValue}>{product.category || 'Standard'}</Text>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specRow}>
                        <Text style={styles.specKey}>Unit of Measure</Text>
                        <Text style={styles.specValue}>{product.unit || 'pcs'}</Text>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specRow}>
                        <Text style={styles.specKey}>Stock Status</Text>
                        <Text style={[styles.specValue, { color: stockBadge.color, fontWeight: '700' }]}>
                            {stockBadge.label}
                        </Text>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specRow}>
                        <Text style={styles.specKey}>Product Code</Text>
                        <Text style={styles.specValue}>#{product.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                </View>

                {/* Description Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {product.description?.trim()
                            ? product.description
                            : 'No specific description added for this product. Tap Edit Product below to add detailed specifications, dimensions, or usage instructions.'}
                    </Text>
                </View>

                {/* Primary Actions */}
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditProduct', { product })}
                >
                    <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.editBtnText}>Edit Product Information</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteOutlineBtn}
                    onPress={handleDelete}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteOutlineBtnText}>Delete Product</Text>
                </TouchableOpacity>
            </ScrollView>
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
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FE',
        justifyContent: 'center',
        alignItems: 'center',
    },

    container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 15 },

    heroCard: {
        backgroundColor: '#F8F9FE',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        overflow: 'hidden',
        marginBottom: 16,
    },
    productImage: { width: '100%', height: 200 },
    imagePlaceholder: {
        height: 160,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderLabel: { fontSize: 13, color: '#5C8AF0', fontWeight: '600', marginTop: 8 },
    heroContent: { padding: 18 },
    categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    categoryPill: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
    stockPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    stockText: { fontSize: 12, fontWeight: 'bold' },
    productName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline' },
    productPrice: { fontSize: 22, fontWeight: '900', color: '#5C8AF0' },
    priceUnit: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },

    stockStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    stockLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
    stockBigNumber: { fontSize: 26, fontWeight: '900', color: '#111827' },
    stockUnitSmall: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    customStockToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    customStockToggleText: { color: '#5C8AF0', fontSize: 12, fontWeight: '700' },

    exactStockBox: {
        backgroundColor: '#F8F9FE',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    inputSubLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '600' },
    inputActionRow: { flexDirection: 'row', alignItems: 'center' },
    stockInput: {
        flex: 1,
        height: 44,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginRight: 10,
    },
    saveStockBtn: {
        backgroundColor: '#5C8AF0',
        paddingHorizontal: 20,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveStockBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    quickAdjustRow: { marginTop: 4 },
    quickAdjustLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 8 },
    adjustBtns: { flexDirection: 'row', justifyContent: 'space-between' },
    adjustBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    adjustMinus: { backgroundColor: '#FEE2E2' },
    adjustMinusText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
    adjustPlus: { backgroundColor: '#ECFDF5' },
    adjustPlusText: { color: '#10B981', fontWeight: 'bold', fontSize: 14 },

    specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    specKey: { fontSize: 14, color: '#6B7280' },
    specValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
    specDivider: { height: 1, backgroundColor: '#F3F4F6' },

    descriptionText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

    editBtn: {
        flexDirection: 'row',
        backgroundColor: '#5C8AF0',
        borderRadius: 14,
        paddingVertical: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    editBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    deleteOutlineBtn: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 14,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    deleteOutlineBtnText: { color: '#EF4444', fontSize: 15, fontWeight: 'bold' },

    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
    emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
    backToListBtn: {
        backgroundColor: '#5C8AF0',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backToListBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
