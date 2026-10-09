import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TaskDescriptionScreen({ navigation }) {
    const [taskDescription, setTaskDescription] = useState('');
    const [shareLocation, setShareLocation] = useState(true);

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
                <TouchableOpacity style={styles.uploadBox}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#2C64E3" style={{ marginBottom: 5 }} />
                    <Text style={styles.uploadTitle}>Upload images</Text>
                    <Text style={styles.uploadSub}>JPG, PNG up to 10MB</Text>
                </TouchableOpacity>

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
                <TouchableOpacity style={styles.calculateButton} onPress={() => navigation.navigate('EstimatedCost')}>
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
