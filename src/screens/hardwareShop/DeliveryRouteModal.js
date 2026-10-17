import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import {
    DEFAULT_SHOP_COORDINATES,
    fetchDrivingRoute,
    generateLeafletMapHtml,
    geocodeAddress,
} from './hardwareDeliveryRouteService';
import { getOrderStatusStyle } from './hardwareShopHelpers';

const POPULAR_LOCATION_PRESETS = [
    'Colombo 03',
    'Colombo 01',
    'Kaduwela',
    'Malabe',
    'Battaramulla',
    'Nugegoda',
    'Dehiwala',
    'Kandy',
    'Galle',
];

export default function DeliveryRouteModal({ visible, order, onClose }) {
    const webViewRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [routeError, setRouteError] = useState(null);

    const [shopCoords, setShopCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);

    const [shopName, setShopName] = useState('Hardware Store');
    const [shopAddress, setShopAddress] = useState('Colombo Central');
    const [currentDestAddress, setCurrentDestAddress] = useState('');

    const [travelTime, setTravelTime] = useState('');
    const [travelDistance, setTravelDistance] = useState('');
    const [routeGeometry, setRouteGeometry] = useState(null);

    // Modal controls for updating origin or destination
    const [showOriginModal, setShowOriginModal] = useState(false);
    const [originInput, setOriginInput] = useState('');
    const [savingOrigin, setSavingOrigin] = useState(false);

    const [showDestModal, setShowDestModal] = useState(false);
    const [destInput, setDestInput] = useState('');
    const [savingDest, setSavingDest] = useState(false);

    // Core route recalculation
    const calculateRouteBetween = async (origin, destination) => {
        if (!origin || !destination) {
            setRouteGeometry(null);
            setTravelTime('');
            setTravelDistance('');
            return;
        }

        const routeResult = await fetchDrivingRoute(origin, destination);
        if (routeResult.success) {
            setTravelTime(routeResult.durationText);
            setTravelDistance(routeResult.distanceKm);
            setRouteGeometry(routeResult.routeGeometry);
            setRouteError(null);
        } else {
            setRouteGeometry(null);
            setTravelTime('');
            setTravelDistance('');
            setRouteError(routeResult.error || 'Driving route could not be calculated.');
        }
    };

    useEffect(() => {
        if (!visible || !order) return;

        let isCancelled = false;

        const loadRoute = async () => {
            setLoading(true);
            setRouteError(null);
            setTravelTime('');
            setTravelDistance('');
            setRouteGeometry(null);

            try {
                // 1. Resolve Hardware Shop Location & Coordinates
                const currentShopOwnerId = order.shopOwnerId || auth.currentUser?.uid;
                let sCoords = order.shopCoordinates || null;
                let sName = 'Hardware Store';
                let sAddress = 'Colombo Central';

                if (currentShopOwnerId) {
                    try {
                        const shopSnap = await getDoc(doc(db, 'users', currentShopOwnerId));
                        if (shopSnap.exists()) {
                            const data = shopSnap.data();
                            sName = data.shopName || data.username || data.name || 'Hardware Store';
                            sAddress = data.location || data.address || 'Colombo Central';
                            if (data.coordinates?.lat && data.coordinates?.lng) {
                                sCoords = { lat: data.coordinates.lat, lng: data.coordinates.lng };
                            }
                        }
                    } catch (err) {
                        console.warn('Could not fetch shop profile coordinates:', err.message);
                    }
                }

                if (!sCoords) {
                    const geocodedShop = await geocodeAddress(sAddress, true);
                    sCoords = geocodedShop || DEFAULT_SHOP_COORDINATES;
                }

                if (isCancelled) return;
                setShopName(sName);
                setShopAddress(sAddress);
                setShopCoords(sCoords);
                setOriginInput(sAddress);

                // 2. Resolve Customer Delivery Destination
                let dCoords = order.deliveryCoordinates || null;
                const destAddress = order.deliveryLocation || '';
                setCurrentDestAddress(destAddress);
                setDestInput(destAddress);

                if (!dCoords && destAddress) {
                    const geocodedDest = await geocodeAddress(destAddress, false);
                    dCoords = geocodedDest;
                }

                if (isCancelled) return;

                if (!dCoords) {
                    setDestCoords(null);
                    setRouteError(
                        destAddress
                            ? `Could not pinpoint exact GPS coordinates for "${destAddress}". You can set or refine the address below.`
                            : 'This order does not specify a delivery destination (e.g. In-store Pickup). You can set an address manually below.'
                    );
                    setLoading(false);
                    return;
                }

                setDestCoords(dCoords);

                // 3. Calculate Driving Route
                await calculateRouteBetween(sCoords, dCoords);
            } catch (err) {
                if (!isCancelled) {
                    setRouteError('An unexpected error occurred while preparing delivery route.');
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        loadRoute();

        return () => {
            isCancelled = true;
        };
    }, [visible, order]);

    if (!order) return null;

    const statusStyle = getOrderStatusStyle(order.status);

    const handleCallCustomer = () => {
        if (!order.customerPhone) {
            Alert.alert('Notice', 'No phone number available for this customer.');
            return;
        }
        const cleaned = order.customerPhone.replace(/[\s-]/g, '');
        Linking.openURL(`tel:${cleaned}`).catch(() => {
            Alert.alert('Error', 'Unable to initiate phone call.');
        });
    };

    const handleOpenExternalNav = () => {
        if (!destCoords) {
            Alert.alert('Notice', 'Delivery destination coordinates are unavailable.');
            return;
        }
        const originQuery = shopCoords ? `${shopCoords.lat},${shopCoords.lng}` : '';
        const destQuery = `${destCoords.lat},${destCoords.lng}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
            originQuery
        )}&destination=${encodeURIComponent(destQuery)}&travelmode=driving`;

        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open external navigation application.');
        });
    };

    const handleWebControl = (funcName) => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.${funcName}(); true;`);
        }
    };

    // Save custom origin (Shop Location)
    const handleSaveOriginLocation = async (chosenAddress) => {
        const addr = (chosenAddress || originInput).trim();
        if (!addr) {
            Alert.alert('Error', 'Please enter a shop origin address or select a preset.');
            return;
        }

        setSavingOrigin(true);
        try {
            const geocoded = await geocodeAddress(addr, true);
            if (!geocoded) {
                Alert.alert('Notice', 'Could not resolve coordinates for this location.');
                setSavingOrigin(false);
                return;
            }

            const newCoords = { lat: geocoded.lat, lng: geocoded.lng };
            setShopCoords(newCoords);
            setShopAddress(addr);

            // Persist to shop profile if authenticated
            const uid = auth.currentUser?.uid;
            if (uid) {
                try {
                    await updateDoc(doc(db, 'users', uid), {
                        location: addr,
                        coordinates: newCoords,
                    });
                } catch (e) {
                    console.warn('Could not update user shop profile coordinates:', e.message);
                }
            }

            setShowOriginModal(false);
            if (destCoords) {
                setLoading(true);
                await calculateRouteBetween(newCoords, destCoords);
                setLoading(false);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to update origin location.');
        } finally {
            setSavingOrigin(false);
        }
    };

    // Save custom destination (Delivery Location)
    const handleSaveDestLocation = async (chosenAddress) => {
        const addr = (chosenAddress || destInput).trim();
        if (!addr) {
            Alert.alert('Error', 'Please enter a customer destination address or city.');
            return;
        }

        setSavingDest(true);
        try {
            const geocoded = await geocodeAddress(addr, false);
            if (!geocoded) {
                Alert.alert(
                    'Location Not Found',
                    `Could not resolve coordinates for "${addr}". Try including a city or district name (e.g., "Kaduwela", "Colombo 03").`
                );
                setSavingDest(false);
                return;
            }

            const newCoords = { lat: geocoded.lat, lng: geocoded.lng };
            setDestCoords(newCoords);
            setCurrentDestAddress(addr);
            setShowDestModal(false);

            if (shopCoords) {
                setLoading(true);
                await calculateRouteBetween(shopCoords, newCoords);
                setLoading(false);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to update destination location.');
        } finally {
            setSavingDest(false);
        }
    };

    const mapHtml = generateLeafletMapHtml({
        origin: shopCoords,
        destination: destCoords,
        routeGeometry,
        shopName,
        customerName: order.customerName || 'House Owner',
        deliveryAddress: currentDestAddress || order.deliveryLocation || 'Delivery Destination',
    });

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                        <Ionicons name="close" size={22} color="#1E2022" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleBox}>
                        <Text style={styles.headerTitle}>Delivery Route & Map</Text>
                        <Text style={styles.headerSub}>Order #{order.orderNumber || order.id}</Text>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: statusStyle.statusBg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.statusColor }]}>
                            {order.status || 'Pending'}
                        </Text>
                    </View>
                </View>

                {/* Driving Metrics Banner */}
                <View style={styles.metricsBanner}>
                    <View style={styles.metricItem}>
                        <Ionicons name="time" size={18} color="#2563EB" />
                        <View style={{ marginLeft: 6 }}>
                            <Text style={styles.metricLabel}>Driving Time (Est.)</Text>
                            <Text style={styles.metricValue}>
                                {loading ? 'Calculating...' : travelTime || 'Unavailable'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                        <Ionicons name="speedometer-outline" size={18} color="#10B981" />
                        <View style={{ marginLeft: 6 }}>
                            <Text style={styles.metricLabel}>Distance</Text>
                            <Text style={styles.metricValue}>
                                {loading ? 'Calculating...' : travelDistance || 'Unavailable'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.navExternalBtn, !destCoords && { opacity: 0.5 }]}
                        onPress={handleOpenExternalNav}
                        disabled={!destCoords}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="navigate" size={15} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.navExternalBtnText}>Navigate</Text>
                    </TouchableOpacity>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimerRow}>
                    <Ionicons name="information-circle-outline" size={13} color="#6B7280" />
                    <Text style={styles.disclaimerText}>
                        Estimated driving travel time is based on actual road network routing; not a guaranteed delivery time.
                    </Text>
                </View>

                {/* Map Area */}
                <View style={styles.mapContainer}>
                    {loading ? (
                        <View style={styles.mapLoadingBox}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={styles.mapLoadingText}>Plotting GPS delivery route on map...</Text>
                        </View>
                    ) : (
                        <>
                            <WebView
                                ref={webViewRef}
                                originWhitelist={['*']}
                                source={{ html: mapHtml }}
                                style={styles.webView}
                                javaScriptEnabled
                                domStorageEnabled
                                startInLoadingState
                                renderLoading={() => (
                                    <View style={styles.mapLoadingBox}>
                                        <ActivityIndicator size="large" color="#2563EB" />
                                    </View>
                                )}
                            />

                            {/* Floating Map Controls */}
                            <View style={styles.mapControls}>
                                <TouchableOpacity
                                    style={styles.mapControlBtn}
                                    onPress={() => handleWebControl('fitAll')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="scan-outline" size={16} color="#2563EB" />
                                    <Text style={styles.mapControlBtnText}>Full Route</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.mapControlBtn}
                                    onPress={() => handleWebControl('focusShop')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="storefront-outline" size={16} color="#2563EB" />
                                    <Text style={styles.mapControlBtnText}>Shop</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.mapControlBtn, !destCoords && { opacity: 0.4 }]}
                                    onPress={() => handleWebControl('focusDestination')}
                                    disabled={!destCoords}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="location-outline" size={16} color="#EF4444" />
                                    <Text style={[styles.mapControlBtnText, { color: '#EF4444' }]}>Customer</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                {/* Route Failure Message if applicable */}
                {routeError && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6, marginTop: 1 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.errorBannerText}>{routeError}</Text>
                            <TouchableOpacity
                                style={styles.errorActionBtn}
                                onPress={() => setShowDestModal(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="create-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                                <Text style={styles.errorActionBtnText}>Set / Refine Delivery Address</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Order & Route Details Bottom Card */}
                <ScrollView contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
                    {/* Origin & Destination Card */}
                    <View style={styles.routeCard}>
                        {/* Origin (Shop) */}
                        <View style={styles.routePointRow}>
                            <View style={styles.pinCircleShop}>
                                <Ionicons name="storefront" size={14} color="#fff" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={styles.pointLabelRow}>
                                    <Text style={styles.pointLabel}>Origin (Your Hardware Store)</Text>
                                    <TouchableOpacity
                                        style={styles.editOriginLink}
                                        onPress={() => setShowOriginModal(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="pencil" size={12} color="#2563EB" style={{ marginRight: 2 }} />
                                        <Text style={styles.editOriginLinkText}>Change</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.pointMainName}>{shopName}</Text>
                                <Text style={styles.pointSub}>{shopAddress}</Text>
                            </View>
                        </View>

                        <View style={styles.routeDottedLine} />

                        {/* Destination (Customer) */}
                        <View style={styles.routePointRow}>
                            <View style={styles.pinCircleCustomer}>
                                <Ionicons name="location" size={16} color="#fff" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={styles.pointLabelRow}>
                                    <Text style={styles.pointLabel}>Destination (Customer Delivery)</Text>
                                    <TouchableOpacity
                                        style={styles.editOriginLink}
                                        onPress={() => setShowDestModal(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="pencil" size={12} color="#2563EB" style={{ marginRight: 2 }} />
                                        <Text style={styles.editOriginLinkText}>Adjust</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.pointMainName}>{order.customerName || 'House Owner'}</Text>
                                <Text style={styles.pointSub}>
                                    {currentDestAddress || order.deliveryLocation || 'Delivery Address Not Specified'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Customer Contact & Items Summary */}
                    <View style={styles.customerBox}>
                        <View style={styles.customerHeaderRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.customerNameTitle}>{order.customerName || 'Customer'}</Text>
                                <Text style={styles.customerPhoneSub}>{order.customerPhone || 'No phone'}</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.callBtn, !order.customerPhone && { opacity: 0.5 }]}
                                onPress={handleCallCustomer}
                                disabled={!order.customerPhone}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="call" size={15} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.callBtnText}>Call Customer</Text>
                            </TouchableOpacity>
                        </View>

                        {order.customerNotes ? (
                            <View style={styles.notesBox}>
                                <Text style={styles.notesTitle}>Customer Delivery Note:</Text>
                                <Text style={styles.notesText}>{order.customerNotes}</Text>
                            </View>
                        ) : null}

                        <View style={styles.itemsSummary}>
                            <Text style={styles.itemsHeader}>
                                Order Items ({(order.items || []).length} {order.items?.length === 1 ? 'item' : 'items'}):
                            </Text>
                            {(order.items || []).map((it, idx) => (
                                <Text key={idx} style={styles.itemBullet} numberOfLines={1}>
                                    • {it.qty} × {it.name}
                                </Text>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* MODAL: Edit Shop Origin Location */}
                <Modal visible={showOriginModal} animationType="fade" transparent onRequestClose={() => setShowOriginModal(false)}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalBackdrop}
                    >
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="storefront" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                                    <Text style={styles.modalTitle}>Set Shop Origin Location</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowOriginModal(false)}>
                                    <Ionicons name="close" size={22} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalDesc}>
                                Set your hardware store's departure origin to calculate real driving delivery paths.
                            </Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter address or city (e.g. Colombo 03, Kaduwela)"
                                placeholderTextColor="#9CA3AF"
                                value={originInput}
                                onChangeText={setOriginInput}
                            />

                            <Text style={styles.presetLabel}>Quick Select City / Zone:</Text>
                            <View style={styles.presetWrap}>
                                {POPULAR_LOCATION_PRESETS.map((preset) => (
                                    <TouchableOpacity
                                        key={preset}
                                        style={[styles.presetChip, originInput === preset && styles.presetChipActive]}
                                        onPress={() => {
                                            setOriginInput(preset);
                                            handleSaveOriginLocation(preset);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.presetChipText,
                                                originInput === preset && styles.presetChipTextActive,
                                            ]}
                                        >
                                            {preset}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setShowOriginModal(false)}
                                    disabled={savingOrigin}
                                >
                                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalSaveBtn}
                                    onPress={() => handleSaveOriginLocation()}
                                    disabled={savingOrigin}
                                >
                                    {savingOrigin ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalSaveBtnText}>Update Origin</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* MODAL: Edit Customer Destination Location */}
                <Modal visible={showDestModal} animationType="fade" transparent onRequestClose={() => setShowDestModal(false)}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalBackdrop}
                    >
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="location" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                                    <Text style={styles.modalTitle}>Refine Delivery Destination</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowDestModal(false)}>
                                    <Ionicons name="close" size={22} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalDesc}>
                                Enter a recognizable street, town, or landmark for this customer's delivery.
                            </Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter address (e.g. Kaduwela Road, Malabe)"
                                placeholderTextColor="#9CA3AF"
                                value={destInput}
                                onChangeText={setDestInput}
                            />

                            <Text style={styles.presetLabel}>Quick Presets:</Text>
                            <View style={styles.presetWrap}>
                                {POPULAR_LOCATION_PRESETS.map((preset) => (
                                    <TouchableOpacity
                                        key={preset}
                                        style={[styles.presetChip, destInput === preset && styles.presetChipActive]}
                                        onPress={() => {
                                            setDestInput(preset);
                                            handleSaveDestLocation(preset);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.presetChipText,
                                                destInput === preset && styles.presetChipTextActive,
                                            ]}
                                        >
                                            {preset}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setShowDestModal(false)}
                                    disabled={savingDest}
                                >
                                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalSaveBtn, { backgroundColor: '#EF4444' }]}
                                    onPress={() => handleSaveDestLocation()}
                                    disabled={savingDest}
                                >
                                    {savingDest ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalSaveBtnText}>Set Destination</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFBFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
    },
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    headerTitleBox: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6B7280' },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: 'bold' },

    metricsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
    },
    metricItem: { flexDirection: 'row', alignItems: 'center' },
    metricLabel: { fontSize: 10, color: '#6B7280', fontWeight: '500' },
    metricValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    metricDivider: { width: 1, height: 26, backgroundColor: '#E5E7EB' },
    navExternalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
    },
    navExternalBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    disclaimerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    disclaimerText: { fontSize: 10, color: '#6B7280', flex: 1 },

    mapContainer: {
        width: '100%',
        height: 280,
        backgroundColor: '#EDF2FE',
        position: 'relative',
    },
    webView: { width: '100%', height: '100%' },
    mapLoadingBox: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F8F9FE',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    mapLoadingText: { marginTop: 8, fontSize: 13, color: '#4B5563', fontWeight: '500' },

    mapControls: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    mapControlBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    mapControlBtnText: { marginLeft: 4, fontSize: 12, fontWeight: 'bold', color: '#2563EB' },

    errorBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#FECACA',
    },
    errorBannerText: { fontSize: 12, color: '#B91C1C', flex: 1, lineHeight: 16 },
    errorActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    errorActionBtnText: { fontSize: 11, fontWeight: 'bold', color: '#2563EB' },

    detailsContent: { padding: 16, paddingBottom: 40 },

    routeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 16,
    },
    routePointRow: { flexDirection: 'row', alignItems: 'flex-start' },
    pointLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    editOriginLink: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF2FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    editOriginLinkText: { fontSize: 10, fontWeight: 'bold', color: '#2563EB' },

    pinCircleShop: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    pinCircleCustomer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    pointLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    pointMainName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginTop: 1 },
    pointSub: { fontSize: 12, color: '#4B5563', marginTop: 1 },
    routeDottedLine: {
        width: 2,
        height: 24,
        backgroundColor: '#CBD5E1',
        marginLeft: 13,
        marginVertical: 4,
    },

    customerBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    customerHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    customerNameTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    customerPhoneSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    callBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    callBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    notesBox: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    notesTitle: { fontSize: 11, fontWeight: 'bold', color: '#4B5563', marginBottom: 2 },
    notesText: { fontSize: 12, color: '#374151' },

    itemsSummary: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
    itemsHeader: { fontSize: 12, fontWeight: 'bold', color: '#4B5563', marginBottom: 4 },
    itemBullet: { fontSize: 12, color: '#6B7280', marginBottom: 2 },

    // Modals
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 420,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    modalDesc: { fontSize: 12, color: '#6B7280', marginBottom: 14, lineHeight: 17 },
    modalInput: {
        backgroundColor: '#F8F9FE',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        marginBottom: 12,
    },
    presetLabel: { fontSize: 11, fontWeight: 'bold', color: '#4B5563', marginBottom: 8 },
    presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
    presetChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    presetChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    presetChipText: { fontSize: 11, color: '#4B5563', fontWeight: '500' },
    presetChipTextActive: { color: '#fff', fontWeight: 'bold' },

    modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    modalCancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    modalCancelBtnText: { color: '#4B5563', fontSize: 13, fontWeight: '600' },
    modalSaveBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSaveBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});
