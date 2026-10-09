import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';

export default function ProductsScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Read products from Firestore
    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            setProducts(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Delete product logic
    const handleDelete = (id) => {
        Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'products', id));
                    } catch (error) {
                        Alert.alert("Error", error.message);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>Rs {item.price}</Text>
            </View>
            <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBottom}>
                <View style={styles.availablePill}>
                    <Text style={styles.availableText}>{item.stock > 0 ? 'Available' : 'Out of Stock'}</Text>
                </View>
                <View style={styles.actionsRow}>
                    <TouchableOpacity onPress={() => navigation.navigate('EditProduct', { product: item })}>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>
                    <Text style={styles.addBtnText}>+ Add Product</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput placeholder="Search products..." placeholderTextColor="#A0A0A0" style={styles.searchInput} />
            </View>

            <Text style={styles.title}>All Products</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#5C8AF0" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center' },
    addBtn: { backgroundColor: '#5C8AF0', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
    addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FE', marginHorizontal: 20, borderRadius: 25, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#EEF2F6', marginBottom: 20 },
    searchIcon: { marginRight: 5 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    title: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginHorizontal: 20, marginBottom: 15 },

    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: '#F8F9FE', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    productName: { fontSize: 15, fontWeight: 'bold', color: '#111827', flex: 1 },
    productPrice: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    categoryPill: { backgroundColor: '#E5E7EB', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 15 },
    categoryText: { color: '#4B5563', fontSize: 11, fontWeight: '500' },

    divider: { height: 1, backgroundColor: '#EEF2F6', marginBottom: 15 },

    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    availablePill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
    availableText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
    actionsRow: { flexDirection: 'row', gap: 15 },
    editText: { color: '#5C8AF0', fontSize: 13, fontWeight: '600' },
    deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600' }
});
