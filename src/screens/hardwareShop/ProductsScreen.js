import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
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
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import {
    PRODUCT_CATEGORIES,
    belongsToShop,
    formatCurrency,
    getStockBadge,
} from './hardwareShopHelpers';
import { adjustProductStock, deleteProduct } from './hardwareShopProductService';

const SORT_OPTIONS = [
    { label: 'Newest Added', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Stock: Lowest First', value: 'stock_asc' },
    { label: 'Name: A to Z', value: 'name_asc' },
];

const STOCK_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Low Stock (≤5)', value: 'low_stock' },
    { label: 'Out of Stock', value: 'out_of_stock' },
];

export default function ProductsScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters & Search
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStockFilter, setSelectedStockFilter] = useState('all');
    const [selectedSort, setSelectedSort] = useState('newest');
    const [showSortModal, setShowSortModal] = useState(false);

    const shopOwnerId = auth.currentUser?.uid;

    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = [];
                snapshot.forEach((docSnap) => {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    if (belongsToShop(data, shopOwnerId)) {
                        list.push(data);
                    }
                });
                setProducts(list);
                setLoading(false);
                setRefreshing(false);
            },
            (err) => {
                console.warn('Error reading products:', err.message);
                setLoading(false);
                setRefreshing(false);
            }
        );
        return () => unsubscribe();
    }, [shopOwnerId]);

    const filteredAndSortedProducts = useMemo(() => {
        let list = [...products];

        // Search Filter
        const term = search.trim().toLowerCase();
        if (term) {
            list = list.filter(
                (p) =>
                    (p.name || '').toLowerCase().includes(term) ||
                    (p.category || '').toLowerCase().includes(term) ||
                    (p.description || '').toLowerCase().includes(term)
            );
        }

        // Category Filter
        if (selectedCategory !== 'All') {
            list = list.filter((p) => p.category === selectedCategory);
        }

        // Stock Status Filter
        if (selectedStockFilter === 'in_stock') {
            list = list.filter((p) => Number(p.stock) > 5);
        } else if (selectedStockFilter === 'low_stock') {
            list = list.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5);
        } else if (selectedStockFilter === 'out_of_stock') {
            list = list.filter((p) => Number(p.stock) <= 0);
        }

        // Sorting
        list.sort((a, b) => {
            if (selectedSort === 'price_asc') {
                return (Number(a.price) || 0) - (Number(b.price) || 0);
            }
            if (selectedSort === 'price_desc') {
                return (Number(b.price) || 0) - (Number(a.price) || 0);
            }
            if (selectedSort === 'stock_asc') {
                return (Number(a.stock) || 0) - (Number(b.stock) || 0);
            }
            if (selectedSort === 'name_asc') {
                return (a.name || '').localeCompare(b.name || '');
            }
            // newest default
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        return list;
    }, [products, search, selectedCategory, selectedStockFilter, selectedSort]);

    const handleQuickStock = async (product, delta) => {
        try {
            await adjustProductStock(product.id, product.stock, delta);
        } catch (error) {
            Alert.alert('Stock Error', error.message || 'Could not adjust stock.');
        }
    };

    const handleDelete = (product) => {
        Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProduct(product.id);
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to delete product.');
                        }
                    },
                },
            ]
        );
    };

    const resetFilters = () => {
        setSearch('');
        setSelectedCategory('All');
        setSelectedStockFilter('all');
        setSelectedSort('newest');
    };

    const renderItem = ({ item }) => {
        const stockBadge = getStockBadge(item.stock);
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ProductDetails', { product: item })}
            >
                <View style={styles.cardMain}>
                    {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.cardThumb} resizeMode="cover" />
                    ) : (
                        <View style={styles.cardThumbPlaceholder}>
                            <Ionicons name="cube-outline" size={24} color="#5C8AF0" />
                        </View>
                    )}

                    <View style={styles.cardInfo}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        </View>

                        <View style={styles.categoryBadgeRow}>
                            <View style={styles.categoryPill}>
                                <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                            </View>
                            <View style={[styles.stockPill, { backgroundColor: stockBadge.bg }]}>
                                <Text style={[styles.stockText, { color: stockBadge.color }]}>
                                    {stockBadge.label}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                            <Text style={styles.priceUnit}> / {item.unit || 'pcs'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                    {/* Quick stock stepper on list */}
                    <View style={styles.stockStepper}>
                        <TouchableOpacity
                            style={[styles.stepperBtn, item.stock <= 0 && styles.stepperBtnDisabled]}
                            onPress={() => handleQuickStock(item, -1)}
                            disabled={item.stock <= 0}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="remove" size={16} color={item.stock <= 0 ? '#D1D5DB' : '#EF4444'} />
                        </TouchableOpacity>
                        <Text style={styles.stepperCount}>{item.stock} {item.unit || 'pcs'}</Text>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => handleQuickStock(item, 1)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="add" size={16} color="#10B981" />
                        </TouchableOpacity>
                    </View>

                    {/* Actions Row */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('EditProduct', { product: item })}
                        >
                            <Ionicons name="create-outline" size={15} color="#5C8AF0" style={{ marginRight: 4 }} />
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { marginLeft: 12 }]}
                            onPress={() => handleDelete(item)}
                        >
                            <Ionicons name="trash-outline" size={15} color="#EF4444" style={{ marginRight: 4 }} />
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const isFiltered = search.trim() !== '' || selectedCategory !== 'All' || selectedStockFilter !== 'all' || selectedSort !== 'newest';

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Products & Inventory</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>
                    <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 2 }} />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search products by name or category..."
                    placeholderTextColor="#A0A0A0"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Filter Chips */}
            <View style={styles.categoriesSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {['All', ...PRODUCT_CATEGORIES].map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.catChip,
                                selectedCategory === cat && styles.catChipActive,
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text
                                style={[
                                    styles.catChipText,
                                    selectedCategory === cat && styles.catChipTextActive,
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Stock Filters & Sort Row */}
            <View style={styles.filterBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.stockFilterScroll}
                >
                    {STOCK_FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.value}
                            style={[
                                styles.stockFilterPill,
                                selectedStockFilter === f.value && styles.stockFilterPillActive,
                            ]}
                            onPress={() => setSelectedStockFilter(f.value)}
                        >
                            <Text
                                style={[
                                    styles.stockFilterText,
                                    selectedStockFilter === f.value && styles.stockFilterTextActive,
                                ]}
                            >
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={styles.sortTriggerBtn}
                    onPress={() => setShowSortModal(true)}
                >
                    <Ionicons name="swap-vertical" size={16} color="#5C8AF0" />
                    <Text style={styles.sortTriggerText}>Sort</Text>
                </TouchableOpacity>
            </View>

            {/* Product Count & Clear Filters Indicator */}
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'} found
                </Text>
                {isFiltered && (
                    <TouchableOpacity onPress={resetFilters}>
                        <Text style={styles.clearFiltersText}>Reset filters</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Product List */}
            {loading ? (
                <ActivityIndicator size="large" color="#5C8AF0" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredAndSortedProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={52} color="#D1D5DB" style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyTitle}>
                                {isFiltered ? 'No Matching Products' : 'No Products Added Yet'}
                            </Text>
                            <Text style={styles.emptySub}>
                                {isFiltered
                                    ? 'Try adjusting your search keywords or clear your active filters.'
                                    : 'Start building your store inventory by adding your first hardware product.'}
                            </Text>
                            {isFiltered ? (
                                <TouchableOpacity style={styles.emptyActionBtn} onPress={resetFilters}>
                                    <Text style={styles.emptyActionBtnText}>Clear All Filters</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.emptyActionBtn}
                                    onPress={() => navigation.navigate('AddProduct')}
                                >
                                    <Text style={styles.emptyActionBtnText}>+ Add New Product</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sort Products By</Text>
                            <TouchableOpacity onPress={() => setShowSortModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        {SORT_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.sortOptionItem,
                                    selectedSort === opt.value && styles.sortOptionItemSelected,
                                ]}
                                onPress={() => {
                                    setSelectedSort(opt.value);
                                    setShowSortModal(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.sortOptionText,
                                        selectedSort === opt.value && styles.sortOptionTextSelected,
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                                {selectedSort === opt.value && (
                                    <Ionicons name="checkmark" size={20} color="#5C8AF0" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
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
    addBtn: {
        flexDirection: 'row',
        backgroundColor: '#5C8AF0',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        alignItems: 'center',
    },
    addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FE',
        marginHorizontal: 20,
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 46,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    categoriesSection: { marginBottom: 10 },
    categoryScroll: { paddingHorizontal: 20, gap: 8 },
    catChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    catChipActive: {
        backgroundColor: '#5C8AF0',
        borderColor: '#5C8AF0',
    },
    catChipText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    catChipTextActive: { color: '#fff', fontWeight: 'bold' },

    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    stockFilterScroll: { gap: 6, paddingRight: 10 },
    stockFilterPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
    },
    stockFilterPillActive: { backgroundColor: '#EDF2FE' },
    stockFilterText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
    stockFilterTextActive: { color: '#5C8AF0', fontWeight: 'bold' },
    sortTriggerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },
    sortTriggerText: { color: '#5C8AF0', fontSize: 11, fontWeight: 'bold', marginLeft: 3 },

    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    metaText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
    clearFiltersText: { fontSize: 12, color: '#5C8AF0', fontWeight: '600' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 30 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    cardMain: { flexDirection: 'row', alignItems: 'center' },
    cardThumb: { width: 64, height: 64, borderRadius: 12, marginRight: 14 },
    cardThumbPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardInfo: { flex: 1 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    productName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    categoryBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    categoryPill: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    categoryText: { color: '#4B5563', fontSize: 10, fontWeight: '600' },
    stockPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    stockText: { fontSize: 10, fontWeight: 'bold' },

    priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
    productPrice: { fontSize: 16, fontWeight: '900', color: '#111827' },
    priceUnit: { fontSize: 12, color: '#6B7280' },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stockStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FE',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    stepperBtn: { padding: 4 },
    stepperBtnDisabled: { opacity: 0.3 },
    stepperCount: { fontSize: 12, fontWeight: 'bold', color: '#111827', marginHorizontal: 8 },

    actionsRow: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center' },
    editText: { color: '#5C8AF0', fontSize: 13, fontWeight: '600' },
    deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
    emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18, paddingHorizontal: 20, marginBottom: 18 },
    emptyActionBtn: {
        backgroundColor: '#5C8AF0',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
    },
    emptyActionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

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
        maxWidth: 360,
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
    sortOptionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    sortOptionItemSelected: { backgroundColor: '#EDF2FE' },
    sortOptionText: { fontSize: 14, color: '#374151' },
    sortOptionTextSelected: { color: '#5C8AF0', fontWeight: 'bold' },
});
