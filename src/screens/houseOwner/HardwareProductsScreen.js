import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
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
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatCurrency, getStockBadge, PRODUCT_CATEGORIES } from '../hardwareShop/hardwareShopHelpers';
import { useCart } from '../../context/CartContext';

export default function HardwareProductsScreen({ navigation }) {
    const { cart, addToCart, cartCount } = useCart();

    const [products, setProducts] = useState([]);
    const [ads, setAds] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [shopsMap, setShopsMap] = useState({});
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedPromo, setSelectedPromo] = useState(null);

    // 1. Fetch products, ads, and discounts in real-time
    useEffect(() => {
        let unsubscribeProducts = () => {};
        let unsubscribeAds = () => {};
        let unsubscribeDiscounts = () => {};

        const fetchShops = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const map = {};
                usersSnap.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.role === 'HardwareShop') {
                        map[docSnap.id] = {
                            name: data.username || data.name || 'Hardware Partner',
                            location: data.location || 'Local Hardware Store',
                            phone: data.mobile || data.phone || '',
                        };
                    }
                });
                setShopsMap(map);
            } catch (err) {
                console.warn('Error fetching shop profiles:', err.message);
            }
        };

        fetchShops();

        // Listen to Real Products
        const prodQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        unsubscribeProducts = onSnapshot(
            prodQuery,
            (snapshot) => {
                const list = [];
                snapshot.forEach((docSnap) => {
                    list.push({ id: docSnap.id, ...docSnap.data() });
                });
                setProducts(list);
                setLoading(false);
            },
            (err) => {
                console.warn('Products query error:', err.message);
                setLoading(false);
            }
        );

        // Listen to Active Advertisements
        const adsQuery = query(collection(db, 'advertisements'), orderBy('createdAt', 'desc'));
        unsubscribeAds = onSnapshot(
            adsQuery,
            (snapshot) => {
                const today = new Date().toISOString().split('T')[0];
                const list = [];
                snapshot.forEach((docSnap) => {
                    const d = { id: docSnap.id, ...docSnap.data() };
                    // Active and within dates if specified
                    const isRunning = d.status === 'RUNNING' || !d.status;
                    const notExpired = !d.endDate || d.endDate >= today;
                    if (isRunning && notExpired) {
                        list.push(d);
                    }
                });
                setAds(list);
            },
            (err) => console.warn('Ads query error:', err.message)
        );

        // Listen to Active Discounts
        const discQuery = query(collection(db, 'hardwareDiscounts'), orderBy('createdAt', 'desc'));
        unsubscribeDiscounts = onSnapshot(
            discQuery,
            (snapshot) => {
                const today = new Date().toISOString().split('T')[0];
                const list = [];
                snapshot.forEach((docSnap) => {
                    const d = { id: docSnap.id, ...docSnap.data() };
                    const isOngoing = d.status === 'ONGOING' || !d.status;
                    const notExpired = !d.validity || d.validity >= today;
                    if (isOngoing && notExpired) {
                        list.push(d);
                    }
                });
                setDiscounts(list);
            },
            (err) => console.warn('Discounts query error:', err.message)
        );

        return () => {
            unsubscribeProducts();
            unsubscribeAds();
            unsubscribeDiscounts();
        };
    }, []);

    // Filter products by search and category
    const filteredProducts = useMemo(() => {
        let list = [...products];

        const term = search.trim().toLowerCase();
        if (term) {
            list = list.filter(
                (p) =>
                    (p.name || '').toLowerCase().includes(term) ||
                    (p.category || '').toLowerCase().includes(term) ||
                    (p.description || '').toLowerCase().includes(term)
            );
        }

        if (selectedCategory !== 'All') {
            list = list.filter((p) => p.category === selectedCategory);
        }

        return list;
    }, [products, search, selectedCategory]);

    const handleSelectProduct = (product) => {
        const shop = shopsMap[product.shopOwnerId] || {
            name: 'FixIt Hardware Partner',
            location: 'Colombo Hardware Hub',
        };
        navigation.navigate('HardwareProductDetails', {
            product: { ...product, shopName: shop.name, shopLocation: shop.location },
        });
    };

    const renderProductItem = ({ item }) => {
        const stockBadge = getStockBadge(item.stock);
        const isOutOfStock = stockBadge.isOut;
        const shop = shopsMap[item.shopOwnerId] || { name: 'Verified Hardware Shop', location: 'Sri Lanka' };

        const cartItem = cart.find((c) => c.id === item.id);
        const qtyInCart = cartItem?.qty || 0;

        return (
            <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() => handleSelectProduct(item)}
            >
                <View style={styles.imageBox}>
                    {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.productImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="construct-outline" size={32} color="#3B66FE" />
                        </View>
                    )}
                    <View style={[styles.stockBadgeFloating, { backgroundColor: stockBadge.bg }]}>
                        <Text style={[styles.stockBadgeText, { color: stockBadge.color }]}>
                            {stockBadge.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.productDetails}>
                    <View style={styles.categoryRow}>
                        <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
                        <Text style={styles.shopLocationText} numberOfLines={1}>
                            <Ionicons name="location-outline" size={11} color="#6B7280" /> {shop.location}
                        </Text>
                    </View>

                    <Text style={styles.productTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.shopOwnerName} numberOfLines={1}>
                        <Ionicons name="storefront-outline" size={12} color="#5C8AF0" /> {shop.name}
                    </Text>

                    <View style={styles.priceAndActionRow}>
                        <View>
                            <Text style={styles.priceText}>{formatCurrency(item.price)}</Text>
                            <Text style={styles.unitText}>per {item.unit || 'pcs'}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.addToCartBtn,
                                isOutOfStock && styles.addToCartBtnDisabled,
                                qtyInCart > 0 && styles.addToCartBtnActive,
                            ]}
                            onPress={() => addToCart({ ...item, shopName: shop.name }, 1)}
                            disabled={isOutOfStock}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={qtyInCart > 0 ? 'checkmark-circle' : 'cart-outline'}
                                size={16}
                                color="#fff"
                                style={{ marginRight: 4 }}
                            />
                            <Text style={styles.addToCartBtnText}>
                                {isOutOfStock ? 'Sold Out' : qtyInCart > 0 ? `In Cart (${qtyInCart})` : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>

                <View style={styles.headerTitles}>
                    <Text style={styles.headerMainTitle}>Hardware Store</Text>
                    <Text style={styles.headerSubTitle}>Tools, materials & supplies</Text>
                </View>

                <View style={styles.headerRightActions}>
                    <TouchableOpacity
                        style={styles.cartHeaderBtn}
                        onPress={() => navigation.navigate('HouseOwnerOrders')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="receipt-outline" size={20} color="#3B66FE" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cartHeaderBtn}
                        onPress={() => navigation.navigate('HardwareCart')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart" size={22} color="#3B66FE" />
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search tools, pipes, paint, cement..."
                        placeholderTextColor="#A0A0A0"
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Advertisements & Promotions Carousel */}
                {ads.length > 0 && (
                    <View style={styles.adsSection}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="megaphone" size={16} color="#3B66FE" />
                                <Text style={styles.sectionHeaderTitle}>Featured Promotions & Ads</Text>
                            </View>
                            <View style={styles.sponsoredBadge}>
                                <Text style={styles.sponsoredBadgeText}>Active Campaigns</Text>
                            </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adsScroll}>
                            {ads.map((ad) => (
                                <View key={ad.id} style={styles.adCard}>
                                    {ad.bannerUri ? (
                                        <Image source={{ uri: ad.bannerUri }} style={styles.adBanner} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.adBannerPlaceholder}>
                                            <Ionicons name="pricetag" size={28} color="#3B66FE" />
                                        </View>
                                    )}
                                    <View style={styles.adContent}>
                                        <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
                                        <Text style={styles.adDesc} numberOfLines={2}>{ad.description}</Text>
                                        {ad.endDate && (
                                            <View style={styles.adDateRow}>
                                                <Ionicons name="time-outline" size={12} color="#EF4444" />
                                                <Text style={styles.adDateText}>Valid till {ad.endDate}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Active Discounts & Coupons */}
                {discounts.length > 0 && (
                    <View style={styles.discountsSection}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="sparkles" size={16} color="#10B981" />
                                <Text style={styles.sectionHeaderTitle}>Available Discount Codes</Text>
                            </View>
                            <Text style={styles.discountSubHint}>Use at checkout</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discountsScroll}>
                            {discounts.map((disc) => (
                                <TouchableOpacity
                                    key={disc.id}
                                    style={styles.discountCard}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        navigation.navigate('HardwareCart', { applyCode: disc.code });
                                    }}
                                >
                                    <View style={styles.discountPill}>
                                        <Ionicons name="ticket" size={14} color="#10B981" style={{ marginRight: 4 }} />
                                        <Text style={styles.discountPillText}>{disc.discountValue || 'Discount'}</Text>
                                    </View>
                                    <Text style={styles.discountCodeText}>{disc.code}</Text>
                                    <Text style={styles.discountTitleText} numberOfLines={1}>{disc.title}</Text>
                                    <View style={styles.applyCouponRow}>
                                        <Text style={styles.applyCouponText}>Tap to use →</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Category Filter Chips */}
                <View style={styles.categoriesSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                        {['All', ...PRODUCT_CATEGORIES].map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                                    onPress={() => setSelectedCategory(cat)}
                                >
                                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Products Count Header */}
                <View style={styles.productsHeaderRow}>
                    <Text style={styles.productsCountTitle}>
                        {selectedCategory === 'All' ? 'All Products' : selectedCategory} ({filteredProducts.length})
                    </Text>
                </View>

                {/* Products List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#3B66FE" style={{ marginTop: 40 }} />
                ) : filteredProducts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="construct-outline" size={54} color="#D1D5DB" style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyTitle}>No Products Found</Text>
                        <Text style={styles.emptySub}>
                            {search.trim()
                                ? `No results for "${search}". Try searching for something else.`
                                : 'Hardware shop owners will add products soon.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        renderItem={renderProductItem}
                        scrollEnabled={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E2022' },
    headerSubTitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
    headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cartHeaderBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
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
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1E2022' },

    // Ads Section
    adsSection: { marginTop: 20 },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E2022' },
    sponsoredBadge: { backgroundColor: '#EDF2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    sponsoredBadgeText: { color: '#3B66FE', fontSize: 10, fontWeight: 'bold' },
    adsScroll: { gap: 12, paddingBottom: 5 },
    adCard: {
        width: 250,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 5,
    },
    adBanner: { width: '100%', height: 100 },
    adBannerPlaceholder: {
        width: '100%',
        height: 90,
        backgroundColor: '#EEF4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adContent: { padding: 12 },
    adTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E2022', marginBottom: 3 },
    adDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
    adDateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    adDateText: { fontSize: 11, color: '#EF4444', fontWeight: '500' },

    // Discounts Section
    discountsSection: { marginTop: 20 },
    discountSubHint: { fontSize: 12, color: '#10B981', fontWeight: '600' },
    discountsScroll: { gap: 10, paddingBottom: 5 },
    discountCard: {
        width: 170,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#D1FAE5',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
        elevation: 1,
    },
    discountPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    discountPillText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
    discountCodeText: { fontSize: 15, fontWeight: '900', color: '#1E2022', letterSpacing: 0.5 },
    discountTitleText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    applyCouponRow: { marginTop: 8 },
    applyCouponText: { fontSize: 11, color: '#3B66FE', fontWeight: 'bold' },

    // Categories
    categoriesSection: { marginTop: 20 },
    categoriesScroll: { gap: 8 },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryChipSelected: { backgroundColor: '#3B66FE', borderColor: '#3B66FE' },
    categoryChipText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
    categoryChipTextSelected: { color: '#fff', fontWeight: 'bold' },

    productsHeaderRow: { marginTop: 20, marginBottom: 12 },
    productsCountTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E2022' },

    // Product Card
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    imageBox: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    productImage: { width: '100%', height: '100%' },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stockBadgeFloating: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        right: 4,
        borderRadius: 4,
        paddingVertical: 1,
        alignItems: 'center',
    },
    stockBadgeText: { fontSize: 9, fontWeight: 'bold' },

    productDetails: { flex: 1, marginLeft: 14, justifyContent: 'space-between' },
    categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryBadge: { fontSize: 11, color: '#3B66FE', fontWeight: '600' },
    shopLocationText: { fontSize: 10, color: '#6B7280', maxWidth: 110 },
    productTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E2022', marginTop: 2 },
    shopOwnerName: { fontSize: 11, color: '#4B5563', marginTop: 2 },

    priceAndActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    priceText: { fontSize: 15, fontWeight: 'bold', color: '#10B981' },
    unitText: { fontSize: 10, color: '#6B7280' },

    addToCartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B66FE',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
    },
    addToCartBtnActive: { backgroundColor: '#10B981' },
    addToCartBtnDisabled: { backgroundColor: '#D1D5DB' },
    addToCartBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginBottom: 4 },
    emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 30 },
});
