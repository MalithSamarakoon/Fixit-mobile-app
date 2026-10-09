import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';

export default function AdsPromosScreen({ navigation }) {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [saving, setSaving] = useState(false);

    // Dummy Discounts Data
    const dummyDiscounts = [
        { id: 'd1', title: '20% Off Electrical Work', validity: 'Valid until Nov 30, 2026 • Code: LIGHT20', status: 'ONGOING', statusColor: '#10B981' },
        { id: 'd2', title: 'Free Plumbing Estimate', validity: 'Valid until Dec 15, 2026 • Code: PLUMBEST', status: 'PAUSED', statusColor: '#6B7280' }
    ];

    // Read Advertisements from Firestore
    useEffect(() => {
        const q = query(collection(db, 'advertisements'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((docSnap) => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            setAds(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setTargetAudience('');
        setShowForm(false);
    };

    // Prepare to Update
    const handleEdit = (ad) => {
        setEditingId(ad.id);
        setTitle(ad.title);
        setDescription(ad.description);
        setStartDate(ad.startDate);
        setEndDate(ad.endDate);
        setTargetAudience(ad.targetAudience || '');
        setShowForm(true);
    };

    // Delete Advertisement
    const handleDelete = (id) => {
        Alert.alert("Delete Advertisement", "Are you sure you want to delete this ad?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'advertisements', id));
                    } catch (error) {
                        Alert.alert("Error", error.message);
                    }
                }
            }
        ]);
    };

    // Create or Update Advertisement
    const handleSave = async () => {
        if (!title || !description || !startDate || !endDate) {
            Alert.alert("Error", "Please fill all required fields");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                // UPDATE logic
                await updateDoc(doc(db, 'advertisements', editingId), {
                    title, description, startDate, endDate, targetAudience
                });
                Alert.alert("Success", "Advertisement updated successfully");
            } else {
                // CREATE logic
                await addDoc(collection(db, 'advertisements'), {
                    title, description, startDate, endDate, targetAudience,
                    status: 'RUNNING',
                    createdAt: serverTimestamp()
                });
                Alert.alert("Success", "Advertisement created successfully");
            }
            resetForm();
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Advertisements & Discounts</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* ACTIVE ADVERTISEMENTS SECTION */}
                <Text style={styles.sectionTitle}>Active Advertisements</Text>

                {loading ? (
                    <ActivityIndicator size="small" color="#5C8AF0" style={{ marginVertical: 20 }} />
                ) : (
                    ads.map((ad) => (
                        <View key={ad.id} style={styles.adCard}>
                            <View style={styles.adTop}>
                                <View style={styles.adImagePlaceholder}>
                                    <Ionicons name="image-outline" size={24} color="#A0A0A0" />
                                </View>
                                <View style={styles.adInfo}>
                                    <Text style={styles.adTitle}>{ad.title}</Text>
                                    <Text style={styles.adDesc} numberOfLines={2}>{ad.description}</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.adBottom}>
                                <Text style={[styles.adStatus, { color: ad.status === 'RUNNING' ? '#10B981' : '#6B7280' }]}>
                                    STATUS: {ad.status || 'RUNNING'}
                                </Text>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity onPress={() => handleEdit(ad)}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(ad.id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}

                {/* SHOW / HIDE FORM BUTTON */}
                {!showForm && (
                    <TouchableOpacity style={styles.createBtn} onPress={() => setShowForm(true)}>
                        <Ionicons name="add" size={18} color="#5C8AF0" style={{ marginRight: 5 }} />
                        <Text style={styles.createBtnText}>Create Advertisement</Text>
                    </TouchableOpacity>
                )}

                {/* CREATE ADVERTISEMENT FORM */}
                {showForm && (
                    <View style={styles.formContainer}>
                        <View style={styles.formHeaderRow}>
                            <Text style={styles.sectionTitle}>Create Advertisement Form</Text>
                            <TouchableOpacity onPress={resetForm} style={styles.closeBtn}>
                                <Ionicons name="close" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.label}>Ad Title</Text>
                            <TextInput style={styles.input} placeholder="e.g. Summer AC Servicing Discount" placeholderTextColor="#A0A0A0" value={title} onChangeText={setTitle} />

                            <Text style={styles.label}>Description</Text>
                            <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} value={description} onChangeText={setDescription} />

                            <Text style={styles.label}>Ad Creative Image</Text>
                            <TouchableOpacity style={styles.uploadBox}>
                                <Ionicons name="cloud-upload-outline" size={24} color="#6B7280" style={{ marginBottom: 5 }} />
                                <Text style={styles.uploadText}>Upload banner (16:9 recommended)</Text>
                            </TouchableOpacity>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.label}>Start Date</Text>
                                    <TextInput style={styles.input} placeholder="MM/DD/YYYY" placeholderTextColor="#A0A0A0" value={startDate} onChangeText={setStartDate} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>End Date</Text>
                                    <TextInput style={styles.input} placeholder="MM/DD/YYYY" placeholderTextColor="#A0A0A0" value={endDate} onChangeText={setEndDate} />
                                </View>
                            </View>

                            <Text style={styles.label}>Target Audience</Text>
                            <TextInput style={styles.input} value={targetAudience} onChangeText={setTargetAudience} />

                            <TouchableOpacity style={styles.publishBtn} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishBtnText}>{editingId ? 'Update Advertisement' : 'Publish Advertisement'}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* DISCOUNTS & PROMOS SECTION */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Discounts & Promos</Text>
                {dummyDiscounts.map(discount => (
                    <View key={discount.id} style={styles.adCard}>
                        <View style={{ paddingVertical: 5 }}>
                            <Text style={styles.adTitle}>{discount.title}</Text>
                            <Text style={styles.adDesc}>{discount.validity}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.adBottom}>
                            <Text style={[styles.adStatus, { color: discount.statusColor }]}>
                                STATUS: {discount.status}
                            </Text>
                            <View style={styles.actionRow}>
                                <TouchableOpacity><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                                <TouchableOpacity><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={[styles.createBtn, { marginBottom: 30 }]}>
                    <Ionicons name="add" size={18} color="#5C8AF0" style={{ marginRight: 5 }} />
                    <Text style={styles.createBtnText}>Create Discount Code</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8F9FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    container: { paddingHorizontal: 20, paddingTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },

    adCard: { backgroundColor: '#F8F9FE', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEF2F6' },
    adTop: { flexDirection: 'row', marginBottom: 15 },
    adImagePlaceholder: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    adInfo: { flex: 1, justifyContent: 'center' },
    adTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    adDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
    divider: { height: 1, backgroundColor: '#EEF2F6', marginBottom: 15 },
    adBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    adStatus: { fontSize: 11, fontWeight: 'bold' },
    actionRow: { flexDirection: 'row', gap: 15 },
    editText: { color: '#5C8AF0', fontSize: 13, fontWeight: '600' },
    deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

    createBtn: { flexDirection: 'row', backgroundColor: '#F0F4FF', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    createBtnText: { color: '#5C8AF0', fontSize: 14, fontWeight: 'bold' },

    formContainer: { marginTop: 10, marginBottom: 20 },
    formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    closeBtn: { padding: 5, bottom: 5 },

    formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEF2F6' },
    label: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#F8F9FE', borderWidth: 1, borderColor: '#EEF2F6', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 14, color: '#111827' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    uploadBox: { backgroundColor: '#F8F9FE', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, height: 80, justifyContent: 'center', alignItems: 'center' },
    uploadText: { color: '#6B7280', fontSize: 13 },
    row: { flexDirection: 'row' },

    publishBtn: { backgroundColor: '#5C8AF0', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
    publishBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
