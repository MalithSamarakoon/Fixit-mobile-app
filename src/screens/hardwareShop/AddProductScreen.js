import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../config/firebase';
import {
    PRODUCT_CATEGORIES,
    PRODUCT_UNITS,
    validateNonNegativeInteger,
    validatePositiveNumber,
} from './hardwareShopHelpers';
import { addProduct } from './hardwareShopProductService';

export default function AddProductScreen({ navigation }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [unit, setUnit] = useState('pcs');
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState(null);

    const [errors, setErrors] = useState({});
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Pick image from media library
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant photo library access in your device settings to select a product image.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to pick image.');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Product name is required.';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Product name must be at least 2 characters.';
        } else if (name.trim().length > 100) {
            newErrors.name = 'Product name cannot exceed 100 characters.';
        }

        if (!category.trim()) {
            newErrors.category = 'Please select a product category.';
        }

        if (!price.trim()) {
            newErrors.price = 'Price is required.';
        } else if (!validatePositiveNumber(price)) {
            newErrors.price = 'Price must be a valid positive number greater than 0.';
        }

        if (!stock.trim()) {
            newErrors.stock = 'Stock quantity is required.';
        } else if (!validateNonNegativeInteger(stock)) {
            newErrors.stock = 'Stock must be a valid non-negative whole number (0 or more).';
        }

        if (description.length > 500) {
            newErrors.description = 'Description cannot exceed 500 characters.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please correct the highlighted fields before saving.');
            return;
        }

        setLoading(true);
        try {
            await addProduct({
                name,
                category,
                price,
                stock,
                unit,
                description,
                imageUri,
                shopOwnerId: auth.currentUser?.uid || null,
            });

            Alert.alert('Success', 'Product added to your inventory successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        const hasContent = name || category || price || stock || description || imageUri;
        if (hasContent) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved product details. Are you sure you want to discard them?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Product</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Image Picker Section */}
                <Text style={styles.label}>Product Image (Optional)</Text>
                {imageUri ? (
                    <View style={styles.imagePreviewWrap}>
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                            <Ionicons name="close-circle" size={26} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.changeImageText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                        <Ionicons name="cloud-upload-outline" size={28} color="#5C8AF0" style={{ marginBottom: 6 }} />
                        <Text style={styles.uploadText}>Select product photo from gallery</Text>
                        <Text style={styles.uploadSubText}>PNG, JPG up to 5MB</Text>
                    </TouchableOpacity>
                )}

                {/* Name */}
                <Text style={styles.label}>
                    Product Name <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="e.g. Brass Gate Valve 3/4 inch"
                    placeholderTextColor="#A0A0A0"
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                {/* Category Dropdown */}
                <Text style={styles.label}>
                    Category <Text style={styles.req}>*</Text>
                </Text>
                <TouchableOpacity
                    style={[styles.selectRow, errors.category && styles.inputError]}
                    onPress={() => setShowCategoryModal(true)}
                    activeOpacity={0.8}
                >
                    <Text style={category ? styles.selectTextSelected : styles.selectTextPlaceholder}>
                        {category || 'Select hardware category...'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </TouchableOpacity>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

                {/* Unit of Measurement */}
                <Text style={styles.label}>Unit of Measurement</Text>
                <View style={styles.unitRow}>
                    {PRODUCT_UNITS.map((u) => (
                        <TouchableOpacity
                            key={u}
                            style={[styles.unitChip, unit === u && styles.unitChipActive]}
                            onPress={() => setUnit(u)}
                        >
                            <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                                {u}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Price & Stock Row */}
                <View style={styles.twoColRow}>
                    <View style={styles.col}>
                        <Text style={styles.label}>
                            Price (LKR) <Text style={styles.req}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, errors.price && styles.inputError]}
                            placeholder="e.g. 1500"
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={price}
                            onChangeText={(text) => {
                                setPrice(text);
                                if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                            }}
                        />
                        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                    </View>

                    <View style={styles.col}>
                        <Text style={styles.label}>
                            Stock Quantity <Text style={styles.req}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, errors.stock && styles.inputError]}
                            placeholder="e.g. 50"
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={stock}
                            onChangeText={(text) => {
                                setStock(text);
                                if (errors.stock) setErrors((prev) => ({ ...prev, stock: null }));
                            }}
                        />
                        {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.descHeaderRow}>
                    <Text style={styles.label}>Product Description (Optional)</Text>
                    <Text style={styles.charCount}>{description.length}/500</Text>
                </View>
                <TextInput
                    style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                    placeholder="Enter material, grade, dimensions, warranty, or usage details..."
                    placeholderTextColor="#A0A0A0"
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    value={description}
                    onChangeText={(text) => {
                        setDescription(text);
                        if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
                    }}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

                {/* Action Buttons */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.btnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Product</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    disabled={loading}
                >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Category Selector Modal */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 340 }}>
                            {PRODUCT_CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryItem,
                                        category === cat && styles.categoryItemSelected,
                                    ]}
                                    onPress={() => {
                                        setCategory(cat);
                                        if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.categoryItemText,
                                            category === cat && styles.categoryItemTextSelected,
                                        ]}
                                    >
                                        {cat}
                                    </Text>
                                    {category === cat && (
                                        <Ionicons name="checkmark-circle" size={20} color="#5C8AF0" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
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

    container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

    label: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 8, marginTop: 14 },
    req: { color: '#EF4444' },

    input: {
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        fontSize: 14,
        color: '#111827',
    },
    inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 },

    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 15,
    },
    selectTextSelected: { fontSize: 14, color: '#111827', fontWeight: '500' },
    selectTextPlaceholder: { fontSize: 14, color: '#A0A0A0' },

    unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    unitChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    unitChipActive: { backgroundColor: '#EDF2FE' },
    unitChipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    unitChipTextActive: { color: '#5C8AF0', fontWeight: 'bold' },

    twoColRow: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },

    descHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    charCount: { fontSize: 11, color: '#9CA3AF' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },

    uploadBox: {
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: { color: '#5C8AF0', fontSize: 13, fontWeight: '600' },
    uploadSubText: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },

    imagePreviewWrap: {
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    imagePreview: { width: '100%', height: '100%' },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 13,
    },
    changeImageBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    changeImageText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    saveBtn: {
        backgroundColor: '#5C8AF0',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 26,
    },
    btnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    cancelBtn: {
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    cancelBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },

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
        maxWidth: 380,
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
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    categoryItemSelected: { backgroundColor: '#EDF2FE' },
    categoryItemText: { fontSize: 14, color: '#374151' },
    categoryItemTextSelected: { color: '#5C8AF0', fontWeight: 'bold' },
});
