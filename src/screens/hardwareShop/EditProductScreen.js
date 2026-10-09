import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function EditProductScreen({ route, navigation }) {
    // Receive product data from navigation params
    const { product } = route.params;

    const [name, setName] = useState(product.name);
    const [category, setCategory] = useState(product.category);
    const [price, setPrice] = useState(product.price.toString());
    const [stock, setStock] = useState(product.stock.toString());
    const [description, setDescription] = useState(product.description || '');
    const [loading, setLoading] = useState(false);

    // Update product in Firestore
    const handleUpdate = async () => {
        if (!name || !category || !price || !stock) {
            Alert.alert("Error", "Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            await updateDoc(doc(db, 'products', product.id), {
                name,
                category,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
                description,
            });
            Alert.alert("Success", "Product updated successfully", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Product</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.label}>Category</Text>
                <View style={styles.inputRow}>
                    <TextInput style={styles.inputFlex} value={category} onChangeText={setCategory} />
                    <Ionicons name="chevron-down" size={20} color="#6B7280" style={{ marginRight: 15 }} />
                </View>

                <Text style={styles.label}>Price</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />

                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={stock} onChangeText={setStock} />

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} value={description} onChangeText={setDescription} />

                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Product</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 15 },
    container: { paddingHorizontal: 20, paddingBottom: 30 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#F8F9FE', borderWidth: 1, borderColor: '#EEF2F6', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 14, color: '#111827' },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FE', borderWidth: 1, borderColor: '#EEF2F6', borderRadius: 12, height: 50 },
    inputFlex: { flex: 1, paddingHorizontal: 15, fontSize: 14, color: '#111827' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    saveBtn: { backgroundColor: '#5C8AF0', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
