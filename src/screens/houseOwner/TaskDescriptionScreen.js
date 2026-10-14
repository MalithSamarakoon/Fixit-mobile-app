import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Switch, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function TaskDescriptionScreen({ navigation, route }) {
    const worker = route?.params?.worker;
    const [taskDescription, setTaskDescription] = useState('');
    const [shareLocation, setShareLocation] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    // Dynamic lists for Phone and Hardware
    const [phoneNumbers, setPhoneNumbers] = useState(['+94 77 123 4567']);
    const [hardwareItems, setHardwareItems] = useState([{ id: 1, item: 'Type-G Wall Socket', qty: '2' }]);

    // Add / Update Phone functions
    const addPhone = () => setPhoneNumbers([...phoneNumbers, '']);
    const updatePhone = (text, index) => {
        const newPhones = [...phoneNumbers];
        newPhones[index] = text;
        setPhoneNumbers(newPhones);
    };

    // Add / Update Hardware functions
    const addHardware = () => setHardwareItems([...hardwareItems, { id: Date.now(), item: '', qty: '' }]);
    const updateHardwareItem = (text, index) => {
        const newItems = [...hardwareItems];
        newItems[index].item = text;
        setHardwareItems(newItems);
    };
    const updateHardwareQty = (text, index) => {
        const newItems = [...hardwareItems];
        newItems[index].qty = text;
        setHardwareItems(newItems);
    };

    // Pick image from media library
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please grant photo library access to upload task images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to pick image.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                    <Ionicons name="arrow-back" size={20} color="#1E2022" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Description</Text>
                <View style={{ width: 40 }} /> {/* Spacer to center title */}
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Task Description Section */}
                <Text style={styles.label}>Task Description</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Describe your home repair job in detail..."
                    placeholderTextColor="#A0A0A0"
                    multiline={true}
                    textAlignVertical="top"
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                />

                {/* Share Location Section */}
                <View style={styles.rowBetween}>
                    <Text style={styles.label}>Share Location</Text>
                    <Switch
                        value={shareLocation}
                        onValueChange={setShareLocation}
                        trackColor={{ false: '#E5E7EB', true: '#2C64E3' }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Upload Images Section */}
                {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                            <Ionicons name="close-circle" size={26} color="#FF4D4D" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.changeImageText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                        <Ionicons name="cloud-upload-outline" size={32} color="#2C64E3" style={{ marginBottom: 5 }} />
                        <Text style={styles.uploadTitle}>Upload images</Text>
                        <Text style={styles.uploadSub}>JPG, PNG up to 10MB</Text>
                    </TouchableOpacity>
                )}

                {/* Phone Numbers Section */}
                <Text style={styles.label}>Add phone numbers</Text>
                {phoneNumbers.map((phone, index) => (
                    <View key={index} style={styles.inputRow}>
                        <TextInput
                            style={[styles.inputBase, styles.phoneInput]}
                            placeholder="+94 XX XXX XXXX"
                            placeholderTextColor="#A0A0A0"
                            value={phone}
                            onChangeText={(text) => updatePhone(text, index)}
                            keyboardType="phone-pad"
                        />
                        {/* Only render the + button on the very last row */}
                        {index === phoneNumbers.length - 1 && (
                            <TouchableOpacity style={styles.circleButton} onPress={addPhone}>
                                <Ionicons name="add" size={20} color="#1E2022" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {/* Hardware Section */}
                <Text style={[styles.label, { marginTop: 10 }]}>If you need any hardware, add them below:</Text>

                <View style={styles.hardwareHeadersRow}>
                    <Text style={styles.hardwareHeaderItem}>Item</Text>
                    <Text style={styles.hardwareHeaderQty}>Quantity</Text>
                </View>

                {hardwareItems.map((hw, index) => (
                    <View key={hw.id} style={styles.inputRow}>
                        <TextInput
                            style={[styles.inputBase, styles.hardwareItemInput]}
                            placeholder="Item name"
                            placeholderTextColor="#A0A0A0"
                            value={hw.item}
                            onChangeText={(text) => updateHardwareItem(text, index)}
                        />
                        <TextInput
                            style={[styles.inputBase, styles.hardwareQtyInput]}
                            placeholder="Qty"
                            placeholderTextColor="#A0A0A0"
                            value={hw.qty}
                            onChangeText={(text) => updateHardwareQty(text, index)}
                            keyboardType="numeric"
                        />
                        {/* Only render the + button on the very last row */}
                        {index === hardwareItems.length - 1 && (
                            <TouchableOpacity style={styles.circleButton} onPress={addHardware}>
                                <Ionicons name="add" size={20} color="#1E2022" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {/* Calculate Cost Button */}
                <TouchableOpacity 
                    style={styles.calculateButton} 
                    onPress={() => navigation.navigate('EstimatedCost', {
                        worker,
                        taskDescription,
                        shareLocation,
                        selectedImage,
                        phoneNumbers: phoneNumbers.filter(p => p.trim() !== ''),
                        hardwareItems: hardwareItems.filter(h => h.item.trim() !== '')
                    })}
                >
                    <Text style={styles.calculateButtonText}>Calculate Cost</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E2022' },
    headerIconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    container: { paddingHorizontal: 20, paddingBottom: 40 },

    label: { fontSize: 14, fontWeight: 'bold', color: '#1E2022', marginBottom: 10 },

    textArea: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 15, height: 120, fontSize: 14, marginBottom: 25 },

    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },

    uploadBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    uploadTitle: { color: '#2C64E3', fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
    uploadSub: { color: '#A0A0A0', fontSize: 12 },

    imagePreviewContainer: { 
        height: 160, 
        borderRadius: 16, 
        overflow: 'hidden', 
        marginBottom: 25, 
        position: 'relative', 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        backgroundColor: '#fff' 
    },
    previewImage: { width: '100%', height: '100%' },
    removeImageBtn: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        backgroundColor: '#fff', 
        borderRadius: 13, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOpacity: 0.15, 
        shadowRadius: 3 
    },
    changeImageBtn: { 
        position: 'absolute', 
        bottom: 8, 
        right: 8, 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20 
    },
    changeImageText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    inputBase: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2C64E3', height: 45, borderRadius: 25, paddingHorizontal: 15, fontSize: 14 },

    phoneInput: { flex: 1 },

    circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#1E2022', justifyContent: 'center', alignItems: 'center', marginLeft: 10, backgroundColor: '#FAFBFF' },

    hardwareHeadersRow: { flexDirection: 'row', paddingHorizontal: 5, marginBottom: 5 },
    hardwareHeaderItem: { flex: 1, fontSize: 12, color: '#7E8CA0', fontWeight: '600' },
    hardwareHeaderQty: { width: 70, fontSize: 12, color: '#7E8CA0', fontWeight: '600', textAlign: 'center', marginRight: 50 }, // 50 matches width of btn + margin

    hardwareItemInput: { flex: 1, marginRight: 10 },
    hardwareQtyInput: { width: 70, textAlign: 'center' },

    calculateButton: { backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
    calculateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
