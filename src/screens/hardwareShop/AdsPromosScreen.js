import React, { useState, useEffect } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../config/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
} from 'firebase/firestore';
import { belongsToShop } from './hardwareShopHelpers';

export default function AdsPromosScreen() {
    const [activeTab, setActiveTab] = useState('ads'); // 'ads' | 'discounts'
    const [ads, setAds] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const shopOwnerId = auth.currentUser?.uid;

    // Ad Form State
    const [showAdForm, setShowAdForm] = useState(false);
    const [editingAdId, setEditingAdId] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [targetAudience, setTargetAudience] = useState('All Customers');
    const [bannerUri, setBannerUri] = useState(null);
    const [adErrors, setAdErrors] = useState({});
    const [savingAd, setSavingAd] = useState(false);

    // Discount Form State
    const [showDiscountForm, setShowDiscountForm] = useState(false);
    const [editingDiscountId, setEditingDiscountId] = useState(null);
    const [discountTitle, setDiscountTitle] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [discountValue, setDiscountValue] = useState('15% OFF');
    const [discountValidity, setDiscountValidity] = useState('');
    const [discountStatus, setDiscountStatus] = useState('ONGOING');
    const [discountErrors, setDiscountErrors] = useState({});
    const [savingDiscount, setSavingDiscount] = useState(false);

    useEffect(() => {
        const adsQuery = query(collection(db, 'advertisements'), orderBy('createdAt', 'desc'));
        const unsubscribeAds = onSnapshot(
            adsQuery,
            (snapshot) => {
                const list = [];
                snapshot.forEach((docSnap) => {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    if (belongsToShop(data, shopOwnerId)) {
                        list.push(data);
                    }
                });
                setAds(list);
                setLoading(false);
            },
            (err) => {
                console.warn('Ads error:', err.message);
                setLoading(false);
            }
        );

        const discountsQuery = query(collection(db, 'hardwareDiscounts'), orderBy('createdAt', 'desc'));
        const unsubscribeDiscounts = onSnapshot(
            discountsQuery,
            (snapshot) => {
                const list = snapshot.docs
                    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                    .filter((d) => belongsToShop(d, shopOwnerId));
                setDiscounts(list);
            },
            (err) => {
                console.warn('Discounts error:', err.message);
            }
        );

        return () => {
            unsubscribeAds();
            unsubscribeDiscounts();
        };
    }, [shopOwnerId]);

    // Pick Banner Image
    const handlePickBanner = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please grant photo library access to upload banner images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setBannerUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to select image.');
        }
    };

    // Ad Actions
    const resetAdForm = () => {
        setEditingAdId(null);
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setTargetAudience('All Customers');
        setBannerUri(null);
        setAdErrors({});
        setShowAdForm(false);
    };

    const handleEditAd = (ad) => {
        setEditingAdId(ad.id);
        setTitle(ad.title || '');
        setDescription(ad.description || '');
        setStartDate(ad.startDate || '');
        setEndDate(ad.endDate || '');
        setTargetAudience(ad.targetAudience || 'All Customers');
        setBannerUri(ad.bannerUri || null);
        setAdErrors({});
        setShowAdForm(true);
    };

    const handleDeleteAd = (id) => {
        Alert.alert('Delete Advertisement', 'Are you sure you want to delete this advertisement campaign?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'advertisements', id));
                    } catch (error) {
                        Alert.alert('Error', error.message || 'Failed to delete advertisement.');
                    }
                },
            },
        ]);
    };

    const handleToggleAdStatus = async (ad) => {
        const nextStatus = ad.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
        try {
            await updateDoc(doc(db, 'advertisements', ad.id), { status: nextStatus });
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update ad status.');
        }
    };

    const validateAdForm = () => {
        const errors = {};
        if (!title.trim()) errors.title = 'Ad title is required.';
        if (!description.trim()) errors.description = 'Ad description is required.';
        if (!startDate.trim()) errors.startDate = 'Start date is required.';
        if (!endDate.trim()) errors.endDate = 'End date is required.';

        setAdErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveAd = async () => {
        if (!validateAdForm()) {
            Alert.alert('Validation Error', 'Please complete all required fields.');
            return;
        }

        setSavingAd(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                startDate: startDate.trim(),
                endDate: endDate.trim(),
                targetAudience: targetAudience.trim() || 'All Customers',
                bannerUri: bannerUri || null,
                status: 'RUNNING',
                shopOwnerId: shopOwnerId || null,
            };

            if (editingAdId) {
                await updateDoc(doc(db, 'advertisements', editingAdId), payload);
                Alert.alert('Success', 'Advertisement updated successfully.');
            } else {
                await addDoc(collection(db, 'advertisements'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
                Alert.alert('Success', 'Advertisement published successfully.');
            }
            resetAdForm();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save advertisement.');
        } finally {
            setSavingAd(false);
        }
    };

    // Discount Actions
    const resetDiscountForm = () => {
        setEditingDiscountId(null);
        setDiscountTitle('');
        setDiscountCode('');
        setDiscountValue('15% OFF');
        setDiscountValidity('');
        setDiscountStatus('ONGOING');
        setDiscountErrors({});
        setShowDiscountForm(false);
    };

    const handleEditDiscount = (discount) => {
        setEditingDiscountId(discount.id);
        setDiscountTitle(discount.title || '');
        setDiscountCode(discount.code || '');
        setDiscountValue(discount.discountValue || '15% OFF');
        setDiscountValidity(discount.validity || '');
        setDiscountStatus(discount.status || 'ONGOING');
        setDiscountErrors({});
        setShowDiscountForm(true);
    };

    const handleDeleteDiscount = (id) => {
        Alert.alert('Delete Discount', 'Are you sure you want to delete this discount coupon?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'hardwareDiscounts', id));
                    } catch (error) {
                        Alert.alert('Error', error.message || 'Failed to delete discount.');
                    }
                },
            },
        ]);
    };

    const handleToggleDiscountStatus = async (discount) => {
        const nextStatus = discount.status === 'ONGOING' ? 'PAUSED' : 'ONGOING';
        try {
            await updateDoc(doc(db, 'hardwareDiscounts', discount.id), { status: nextStatus });
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to toggle discount.');
        }
    };

    const validateDiscountForm = () => {
        const errors = {};
        if (!discountTitle.trim()) errors.title = 'Discount title is required.';
        if (!discountCode.trim()) {
            errors.code = 'Promo code is required.';
        } else if (discountCode.trim().length < 3) {
            errors.code = 'Promo code must be at least 3 characters.';
        }
        if (!discountValidity.trim()) errors.validity = 'Validity text or expiry date is required.';

        setDiscountErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveDiscount = async () => {
        if (!validateDiscountForm()) {
            Alert.alert('Validation Error', 'Please check the highlighted fields.');
            return;
        }

        setSavingDiscount(true);
        try {
            const payload = {
                title: discountTitle.trim(),
                code: discountCode.trim().toUpperCase().replace(/\s+/g, ''),
                discountValue: discountValue.trim(),
                validity: discountValidity.trim(),
                status: discountStatus,
                shopOwnerId: shopOwnerId || null,
            };

            if (editingDiscountId) {
                await updateDoc(doc(db, 'hardwareDiscounts', editingDiscountId), payload);
                Alert.alert('Success', 'Discount coupon updated.');
            } else {
                await addDoc(collection(db, 'hardwareDiscounts'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
                Alert.alert('Success', 'Discount coupon created.');
            }
            resetDiscountForm();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save discount.');
        } finally {
            setSavingDiscount(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Marketing & Promotions</Text>
            </View>

            {/* Segment Tabs */}
            <View style={styles.segmentContainer}>
                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === 'ads' && styles.segmentBtnActive]}
                    onPress={() => setActiveTab('ads')}
                >
                    <Ionicons
                        name="megaphone-outline"
                        size={16}
                        color={activeTab === 'ads' ? '#fff' : '#6B7280'}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.segmentBtnText, activeTab === 'ads' && styles.segmentBtnTextActive]}>
                        Advertisements ({ads.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === 'discounts' && styles.segmentBtnActive]}
                    onPress={() => setActiveTab('discounts')}
                >
                    <Ionicons
                        name="pricetag-outline"
                        size={16}
                        color={activeTab === 'discounts' ? '#fff' : '#6B7280'}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.segmentBtnText, activeTab === 'discounts' && styles.segmentBtnTextActive]}>
                        Discount Codes ({discounts.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#5C8AF0" style={{ marginVertical: 40 }} />
                ) : activeTab === 'ads' ? (
                    /* ADVERTISEMENTS TAB */
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Active Campaigns</Text>
                            {!showAdForm && (
                                <TouchableOpacity
                                    style={styles.addSmallBtn}
                                    onPress={() => {
                                        resetAdForm();
                                        setShowAdForm(true);
                                    }}
                                >
                                    <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 2 }} />
                                    <Text style={styles.addSmallBtnText}>New Ad</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {ads.length === 0 && !showAdForm ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="megaphone-outline" size={44} color="#D1D5DB" style={{ marginBottom: 8 }} />
                                <Text style={styles.emptyCardTitle}>No active advertisements</Text>
                                <Text style={styles.emptyCardSub}>
                                    Promote your hardware store, seasonal sales, or special services.
                                </Text>
                                <TouchableOpacity
                                    style={styles.createFirstBtn}
                                    onPress={() => setShowAdForm(true)}
                                >
                                    <Text style={styles.createFirstBtnText}>+ Create Advertisement</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            ads.map((ad) => {
                                const isRunning = ad.status === 'RUNNING';
                                return (
                                    <View key={ad.id} style={styles.adCard}>
                                        <View style={styles.adTop}>
                                            {ad.bannerUri ? (
                                                <Image source={{ uri: ad.bannerUri }} style={styles.adBannerImg} resizeMode="cover" />
                                            ) : (
                                                <View style={styles.adImagePlaceholder}>
                                                    <Ionicons name="megaphone-outline" size={26} color="#5C8AF0" />
                                                </View>
                                            )}
                                            <View style={styles.adInfo}>
                                                <Text style={styles.adTitle}>{ad.title}</Text>
                                                <Text style={styles.adDesc} numberOfLines={2}>
                                                    {ad.description}
                                                </Text>
                                                <Text style={styles.adDates}>
                                                    {ad.startDate} - {ad.endDate}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.adBottom}>
                                            <TouchableOpacity
                                                style={[styles.statusTogglePill, isRunning ? styles.runningBg : styles.pausedBg]}
                                                onPress={() => handleToggleAdStatus(ad)}
                                            >
                                                <View style={[styles.statusDot, { backgroundColor: isRunning ? '#10B981' : '#6B7280' }]} />
                                                <Text style={[styles.adStatusText, { color: isRunning ? '#10B981' : '#6B7280' }]}>
                                                    {isRunning ? 'RUNNING (Tap to pause)' : 'PAUSED (Tap to run)'}
                                                </Text>
                                            </TouchableOpacity>

                                            <View style={styles.actionRow}>
                                                <TouchableOpacity onPress={() => handleEditAd(ad)} style={styles.iconActionBtn}>
                                                    <Ionicons name="create-outline" size={16} color="#5C8AF0" />
                                                    <Text style={styles.editText}>Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteAd(ad.id)} style={styles.iconActionBtn}>
                                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                    <Text style={styles.deleteText}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        {/* Ad Form */}
                        {showAdForm && (
                            <View style={styles.formCard}>
                                <View style={styles.formHeaderRow}>
                                    <Text style={styles.formTitle}>
                                        {editingAdId ? 'Edit Advertisement' : 'Create Advertisement'}
                                    </Text>
                                    <TouchableOpacity onPress={resetAdForm}>
                                        <Ionicons name="close" size={22} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>
                                    Ad Title <Text style={styles.req}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, adErrors.title && styles.inputError]}
                                    placeholder="e.g. 20% Off Plumbing & Electrical Supplies"
                                    placeholderTextColor="#A0A0A0"
                                    value={title}
                                    onChangeText={(t) => {
                                        setTitle(t);
                                        if (adErrors.title) setAdErrors((p) => ({ ...p, title: null }));
                                    }}
                                />
                                {adErrors.title && <Text style={styles.errorText}>{adErrors.title}</Text>}

                                <Text style={styles.label}>
                                    Description <Text style={styles.req}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, adErrors.description && styles.inputError]}
                                    placeholder="Describe the offer, qualifying products, or conditions..."
                                    placeholderTextColor="#A0A0A0"
                                    multiline
                                    numberOfLines={3}
                                    value={description}
                                    onChangeText={(t) => {
                                        setDescription(t);
                                        if (adErrors.description) setAdErrors((p) => ({ ...p, description: null }));
                                    }}
                                />
                                {adErrors.description && <Text style={styles.errorText}>{adErrors.description}</Text>}

                                <Text style={styles.label}>Banner Image (Optional)</Text>
                                {bannerUri ? (
                                    <View style={styles.bannerPreviewWrap}>
                                        <Image source={{ uri: bannerUri }} style={styles.bannerPreview} resizeMode="cover" />
                                        <TouchableOpacity style={styles.removeBannerBtn} onPress={() => setBannerUri(null)}>
                                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.uploadBox} onPress={handlePickBanner}>
                                        <Ionicons name="image-outline" size={24} color="#5C8AF0" style={{ marginBottom: 4 }} />
                                        <Text style={styles.uploadText}>Upload campaign banner (16:9 recommended)</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.twoColRow}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>
                                            Start Date <Text style={styles.req}>*</Text>
                                        </Text>
                                        <TextInput
                                            style={[styles.input, adErrors.startDate && styles.inputError]}
                                            placeholder="MM/DD/YYYY"
                                            placeholderTextColor="#A0A0A0"
                                            value={startDate}
                                            onChangeText={(t) => {
                                                setStartDate(t);
                                                if (adErrors.startDate) setAdErrors((p) => ({ ...p, startDate: null }));
                                            }}
                                        />
                                        {adErrors.startDate && <Text style={styles.errorText}>{adErrors.startDate}</Text>}
                                    </View>

                                    <View style={styles.col}>
                                        <Text style={styles.label}>
                                            End Date <Text style={styles.req}>*</Text>
                                        </Text>
                                        <TextInput
                                            style={[styles.input, adErrors.endDate && styles.inputError]}
                                            placeholder="MM/DD/YYYY"
                                            placeholderTextColor="#A0A0A0"
                                            value={endDate}
                                            onChangeText={(t) => {
                                                setEndDate(t);
                                                if (adErrors.endDate) setAdErrors((p) => ({ ...p, endDate: null }));
                                            }}
                                        />
                                        {adErrors.endDate && <Text style={styles.errorText}>{adErrors.endDate}</Text>}
                                    </View>
                                </View>

                                <Text style={styles.label}>Target Audience</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Homeowners, Trade Workers, Contractors"
                                    placeholderTextColor="#A0A0A0"
                                    value={targetAudience}
                                    onChangeText={setTargetAudience}
                                />

                                <TouchableOpacity
                                    style={[styles.publishBtn, savingAd && styles.btnDisabled]}
                                    onPress={handleSaveAd}
                                    disabled={savingAd}
                                >
                                    {savingAd ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.publishBtnText}>
                                            {editingAdId ? 'Update Advertisement' : 'Publish Advertisement'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                ) : (
                    /* DISCOUNT CODES TAB */
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Promo Codes & Coupons</Text>
                            {!showDiscountForm && (
                                <TouchableOpacity
                                    style={styles.addSmallBtn}
                                    onPress={() => {
                                        resetDiscountForm();
                                        setShowDiscountForm(true);
                                    }}
                                >
                                    <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 2 }} />
                                    <Text style={styles.addSmallBtnText}>New Coupon</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {discounts.length === 0 && !showDiscountForm ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="pricetag-outline" size={44} color="#D1D5DB" style={{ marginBottom: 8 }} />
                                <Text style={styles.emptyCardTitle}>No discount coupons created</Text>
                                <Text style={styles.emptyCardSub}>
                                    Create promo codes that customers can apply at checkout.
                                </Text>
                                <TouchableOpacity
                                    style={styles.createFirstBtn}
                                    onPress={() => setShowDiscountForm(true)}
                                >
                                    <Text style={styles.createFirstBtnText}>+ Create Discount Code</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            discounts.map((discount) => {
                                const isOngoing = discount.status === 'ONGOING';
                                return (
                                    <View key={discount.id} style={styles.adCard}>
                                        <View style={styles.discountTopRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.adTitle}>{discount.title}</Text>
                                                <Text style={styles.discountValueText}>
                                                    Benefit: {discount.discountValue || 'Discount Applied'}
                                                </Text>
                                                <Text style={styles.discountValidityText}>
                                                    <Ionicons name="calendar-outline" size={12} color="#6B7280" /> {discount.validity}
                                                </Text>
                                            </View>
                                            <View style={styles.codeBadge}>
                                                <Text style={styles.codeBadgeText}>{discount.code}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.adBottom}>
                                            <TouchableOpacity
                                                style={[styles.statusTogglePill, isOngoing ? styles.runningBg : styles.pausedBg]}
                                                onPress={() => handleToggleDiscountStatus(discount)}
                                            >
                                                <View style={[styles.statusDot, { backgroundColor: isOngoing ? '#10B981' : '#6B7280' }]} />
                                                <Text style={[styles.adStatusText, { color: isOngoing ? '#10B981' : '#6B7280' }]}>
                                                    {isOngoing ? 'ACTIVE (Tap to pause)' : 'PAUSED (Tap to activate)'}
                                                </Text>
                                            </TouchableOpacity>

                                            <View style={styles.actionRow}>
                                                <TouchableOpacity onPress={() => handleEditDiscount(discount)} style={styles.iconActionBtn}>
                                                    <Ionicons name="create-outline" size={16} color="#5C8AF0" />
                                                    <Text style={styles.editText}>Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteDiscount(discount.id)} style={styles.iconActionBtn}>
                                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                    <Text style={styles.deleteText}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        {/* Discount Form */}
                        {showDiscountForm && (
                            <View style={styles.formCard}>
                                <View style={styles.formHeaderRow}>
                                    <Text style={styles.formTitle}>
                                        {editingDiscountId ? 'Edit Discount Code' : 'New Discount Code'}
                                    </Text>
                                    <TouchableOpacity onPress={resetDiscountForm}>
                                        <Ionicons name="close" size={22} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>
                                    Campaign Title <Text style={styles.req}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, discountErrors.title && styles.inputError]}
                                    value={discountTitle}
                                    onChangeText={(t) => {
                                        setDiscountTitle(t);
                                        if (discountErrors.title) setDiscountErrors((p) => ({ ...p, title: null }));
                                    }}
                                    placeholder="e.g. 15% Off Electrical Accessories"
                                    placeholderTextColor="#A0A0A0"
                                />
                                {discountErrors.title && <Text style={styles.errorText}>{discountErrors.title}</Text>}

                                <View style={styles.twoColRow}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>
                                            Promo Code <Text style={styles.req}>*</Text>
                                        </Text>
                                        <TextInput
                                            style={[styles.input, discountErrors.code && styles.inputError]}
                                            value={discountCode}
                                            onChangeText={(t) => {
                                                setDiscountCode(t.toUpperCase());
                                                if (discountErrors.code) setDiscountErrors((p) => ({ ...p, code: null }));
                                            }}
                                            placeholder="ELECTRO15"
                                            placeholderTextColor="#A0A0A0"
                                            autoCapitalize="characters"
                                        />
                                        {discountErrors.code && <Text style={styles.errorText}>{discountErrors.code}</Text>}
                                    </View>

                                    <View style={styles.col}>
                                        <Text style={styles.label}>Discount Value</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={discountValue}
                                            onChangeText={setDiscountValue}
                                            placeholder="e.g. 15% OFF or Rs 500"
                                            placeholderTextColor="#A0A0A0"
                                        />
                                    </View>
                                </View>

                                <Text style={styles.label}>
                                    Validity / Expiry Details <Text style={styles.req}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, discountErrors.validity && styles.inputError]}
                                    value={discountValidity}
                                    onChangeText={(t) => {
                                        setDiscountValidity(t);
                                        if (discountErrors.validity) setDiscountErrors((p) => ({ ...p, validity: null }));
                                    }}
                                    placeholder="e.g. Valid until Nov 30, 2026"
                                    placeholderTextColor="#A0A0A0"
                                />
                                {discountErrors.validity && <Text style={styles.errorText}>{discountErrors.validity}</Text>}

                                <Text style={styles.label}>Status</Text>
                                <View style={styles.statusChipRow}>
                                    {['ONGOING', 'PAUSED'].map((st) => (
                                        <TouchableOpacity
                                            key={st}
                                            style={[styles.statusChip, discountStatus === st && styles.statusChipActive]}
                                            onPress={() => setDiscountStatus(st)}
                                        >
                                            <Text style={[styles.statusChipText, discountStatus === st && styles.statusChipTextActive]}>
                                                {st === 'ONGOING' ? 'Active (Ongoing)' : 'Paused'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.publishBtn, savingDiscount && styles.btnDisabled]}
                                    onPress={handleSaveDiscount}
                                    disabled={savingDiscount}
                                >
                                    {savingDiscount ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.publishBtnText}>
                                            {editingDiscountId ? 'Update Discount' : 'Save Discount'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    segmentContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 8,
        gap: 10,
    },
    segmentBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    segmentBtnActive: { backgroundColor: '#5C8AF0', borderColor: '#5C8AF0' },
    segmentBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    segmentBtnTextActive: { color: '#fff', fontWeight: 'bold' },

    container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
    addSmallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5C8AF0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    addSmallBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    emptyCard: {
        backgroundColor: '#F8F9FE',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    emptyCardSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
    createFirstBtn: {
        backgroundColor: '#5C8AF0',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },
    createFirstBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

    adCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    adTop: { flexDirection: 'row' },
    adBannerImg: { width: 72, height: 72, borderRadius: 10, marginRight: 12 },
    adImagePlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 10,
        backgroundColor: '#EDF2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    adInfo: { flex: 1, justifyContent: 'center' },
    adTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    adDesc: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginBottom: 4 },
    adDates: { fontSize: 11, color: '#9CA3AF' },

    discountTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    discountValueText: { fontSize: 13, color: '#10B981', fontWeight: 'bold', marginVertical: 3 },
    discountValidityText: { fontSize: 12, color: '#6B7280' },
    codeBadge: {
        backgroundColor: '#EDF2FE',
        borderWidth: 1,
        borderColor: '#C7D2FE',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    codeBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#5C8AF0', letterSpacing: 1 },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    adBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusTogglePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    runningBg: { backgroundColor: '#ECFDF5' },
    pausedBg: { backgroundColor: '#F3F4F6' },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    adStatusText: { fontSize: 11, fontWeight: 'bold' },

    actionRow: { flexDirection: 'row', gap: 12 },
    iconActionBtn: { flexDirection: 'row', alignItems: 'center' },
    editText: { color: '#5C8AF0', fontSize: 13, fontWeight: '600', marginLeft: 2 },
    deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginLeft: 2 },

    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 20,
    },
    formHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    formTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },

    label: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 6, marginTop: 12 },
    req: { color: '#EF4444' },
    input: {
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14,
        color: '#111827',
    },
    inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },

    textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
    twoColRow: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },

    uploadBox: {
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#EEF2F6',
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: { color: '#5C8AF0', fontSize: 12, fontWeight: '600' },
    bannerPreviewWrap: {
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F8F9FE',
    },
    bannerPreview: { width: '100%', height: '100%' },
    removeBannerBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: '#fff', borderRadius: 12 },

    statusChipRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    statusChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    statusChipActive: { backgroundColor: '#EDF2FE' },
    statusChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    statusChipTextActive: { color: '#5C8AF0', fontWeight: 'bold' },

    publishBtn: {
        backgroundColor: '#5C8AF0',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    btnDisabled: { opacity: 0.6 },
    publishBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
