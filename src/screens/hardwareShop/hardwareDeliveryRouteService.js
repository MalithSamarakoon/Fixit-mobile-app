/**
 * hardwareDeliveryRouteService.js
 * GPS Location, Geocoding, and Routing service for Hardware Shop Owner delivery tracking.
 * Uses OpenStreetMap, Nominatim, and OSRM (Open Source Routing Machine) driving directions.
 */

// Well-known coordinates for Sri Lankan cities and districts for instantaneous offline resolution
export const SRI_LANKA_KNOWN_LOCATIONS = {
    // Colombo Districts / Zones
    'colombo': { lat: 6.9271, lng: 79.8612, name: 'Colombo' },
    'colombo 01': { lat: 6.9344, lng: 79.8428, name: 'Colombo 01 (Fort)' },
    'colombo 02': { lat: 6.9234, lng: 79.8546, name: 'Colombo 02 (Slave Island)' },
    'colombo 03': { lat: 6.9064, lng: 79.8519, name: 'Colombo 03 (Kollupitiya)' },
    'colombo 04': { lat: 6.8924, lng: 79.8564, name: 'Colombo 04 (Bambalapitiya)' },
    'colombo 05': { lat: 6.8833, lng: 79.8711, name: 'Colombo 05 (Havelock Town)' },
    'colombo 06': { lat: 6.8719, lng: 79.8631, name: 'Colombo 06 (Wellawatte)' },
    'colombo 07': { lat: 6.9114, lng: 79.8687, name: 'Colombo 07 (Cinnamon Gardens)' },
    'colombo 08': { lat: 6.9175, lng: 79.8821, name: 'Colombo 08 (Borella)' },
    'colombo 09': { lat: 6.9333, lng: 79.8794, name: 'Colombo 09 (Dematagoda)' },
    'colombo 10': { lat: 6.9297, lng: 79.8681, name: 'Colombo 10 (Maradana)' },
    'colombo 11': { lat: 6.9403, lng: 79.8539, name: 'Colombo 11 (Pettah)' },
    'colombo 12': { lat: 6.9422, lng: 79.8622, name: 'Colombo 12 (Hultsdorf)' },
    'colombo 13': { lat: 6.9536, lng: 79.8639, name: 'Colombo 13 (Kotahena)' },
    'colombo 14': { lat: 6.9589, lng: 79.8756, name: 'Colombo 14 (Grandpass)' },
    'colombo 15': { lat: 6.9744, lng: 79.8722, name: 'Colombo 15 (Mattakkuliya)' },

    // Suburbs & Nearby Towns
    'kaduwela': { lat: 6.9344, lng: 79.9839, name: 'Kaduwela' },
    'kothalawala': { lat: 6.9308, lng: 79.9678, name: 'Kothalawala, Kaduwela' },
    'malabe': { lat: 6.9042, lng: 79.9547, name: 'Malabe' },
    'battaramulla': { lat: 6.8994, lng: 79.9189, name: 'Battaramulla' },
    'rajagiriya': { lat: 6.9089, lng: 79.8944, name: 'Rajagiriya' },
    'nugegoda': { lat: 6.8649, lng: 79.8997, name: 'Nugegoda' },
    'maharagama': { lat: 6.8481, lng: 79.9267, name: 'Maharagama' },
    'dehiwala': { lat: 6.8517, lng: 79.8658, name: 'Dehiwala' },
    'mount lavinia': { lat: 6.8378, lng: 79.8644, name: 'Mount Lavinia' },
    'moratuwa': { lat: 6.7731, lng: 79.8817, name: 'Moratuwa' },
    'panadura': { lat: 6.7133, lng: 79.9078, name: 'Panadura' },
    'kalutara': { lat: 6.5854, lng: 79.9607, name: 'Kalutara' },
    'homagama': { lat: 6.8419, lng: 80.0031, name: 'Homagama' },
    'kottawa': { lat: 6.8436, lng: 79.9661, name: 'Kottawa' },
    'kelaniya': { lat: 6.9553, lng: 79.9222, name: 'Kelaniya' },
    'kiribathgoda': { lat: 6.9806, lng: 79.9289, name: 'Kiribathgoda' },
    'gampaha': { lat: 7.0897, lng: 79.9925, name: 'Gampaha' },
    'negombo': { lat: 7.2083, lng: 79.8358, name: 'Negombo' },

    // Major Cities
    'kandy': { lat: 7.2906, lng: 80.6337, name: 'Kandy' },
    'galle': { lat: 6.0535, lng: 80.2210, name: 'Galle' },
    'matara': { lat: 5.9549, lng: 80.5550, name: 'Matara' },
    'kurunegala': { lat: 7.4863, lng: 80.3623, name: 'Kurunegala' },
    'ratnapura': { lat: 6.6828, lng: 80.4000, name: 'Ratnapura' },
    'jaffna': { lat: 9.6615, lng: 80.0255, name: 'Jaffna' },
    'anuradhapura': { lat: 8.3114, lng: 80.4037, name: 'Anuradhapura' },
};

// Default fallback origin if no shop location is specified (Colombo Central)
export const DEFAULT_SHOP_COORDINATES = {
    lat: 6.9271,
    lng: 79.8612,
    name: 'Hardware Store (Colombo Central)',
};

/**
 * Normalizes and geocodes an address string to { lat, lng, displayName }.
 * Uses built-in Sri Lankan city mapping first, falls back to Nominatim OSM API.
 * @param {string} addressString - Raw text address
 * @param {boolean} allowDefaultFallback - If true and address cannot be resolved, returns DEFAULT_SHOP_COORDINATES.
 */
export async function geocodeAddress(addressString, allowDefaultFallback = false) {
    if (!addressString || typeof addressString !== 'string') {
        return allowDefaultFallback ? DEFAULT_SHOP_COORDINATES : null;
    }

    const clean = addressString.trim().toLowerCase();

    // Check if it's explicitly pickup or empty
    if (!clean || clean.includes('in-store pickup') || clean.includes('pickup only') || clean === 'pickup') {
        return null;
    }

    // 1. Try local dictionary lookup (longest/most specific match first)
    const sortedLocations = Object.entries(SRI_LANKA_KNOWN_LOCATIONS).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of sortedLocations) {
        if (clean.includes(key)) {
            return {
                lat: val.lat,
                lng: val.lng,
                displayName: val.name,
                source: 'local_lookup',
            };
        }
    }

    // 2. Query Nominatim OpenStreetMap Geocoding API
    try {
        const query = clean.includes('sri lanka') ? clean : `${clean}, Sri Lanka`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
        )}&countrycodes=lk&limit=1`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, {
            headers: { 'User-Agent': 'FixIt-Mobile-App/1.0 (delivery-tracking)' },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    displayName: data[0].display_name,
                    source: 'nominatim',
                };
            }
        }
    } catch (err) {
        console.warn('Geocoding network error (using fallback):', err.message);
    }

    // 3. Fallback check
    if (allowDefaultFallback) {
        return {
            ...DEFAULT_SHOP_COORDINATES,
            displayName: addressString,
            source: 'default_fallback',
        };
    }

    return null;
}

/**
 * Calculates the driving route between origin and destination using OSRM.
 * Returns { success, distanceKm, durationMinutes, durationText, routeGeometry, error }
 */
export async function fetchDrivingRoute(originCoords, destCoords) {
    if (!originCoords || !destCoords) {
        return {
            success: false,
            error: 'Origin or destination coordinates are missing.',
        };
    }

    const { lat: oLat, lng: oLng } = originCoords;
    const { lat: dLat, lng: dLng } = destCoords;

    const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
            headers: { 'User-Agent': 'FixIt-Mobile-App/1.0 (driving-route)' },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            return {
                success: false,
                error: `Routing service returned status ${res.status}. Route estimate unavailable.`,
            };
        }

        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            return {
                success: false,
                error: 'No drivable road route found between the shop and delivery destination.',
            };
        }

        const route = data.routes[0];
        const distanceMeters = route.distance || 0;
        const durationSeconds = route.duration || 0;

        const distanceKm = (distanceMeters / 1000).toFixed(1);
        const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));

        let durationText = '';
        if (totalMinutes < 60) {
            durationText = `${totalMinutes} min${totalMinutes === 1 ? '' : 's'}`;
        } else {
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            durationText = mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr${hrs === 1 ? '' : 's'}`;
        }

        return {
            success: true,
            distanceKm: `${distanceKm} km`,
            distanceMeters,
            durationMinutes: totalMinutes,
            durationText,
            routeGeometry: route.geometry, // GeoJSON LineString
        };
    } catch (err) {
        return {
            success: false,
            error: err.name === 'AbortError'
                ? 'Routing request timed out. Please check your network.'
                : 'Could not connect to routing server. Please try again.',
        };
    }
}

/**
 * Builds the interactive Leaflet HTML to render inside react-native-webview.
 */
export function generateLeafletMapHtml({
    origin,
    destination,
    routeGeometry,
    shopName = 'Hardware Store',
    customerName = 'Customer',
    deliveryAddress = 'Delivery Destination',
}) {
    const hasOrigin = !!origin?.lat && !!origin?.lng;
    const hasDest = !!destination?.lat && !!destination?.lng;

    const originLat = origin?.lat || 6.9271;
    const originLng = origin?.lng || 79.8612;
    const destLat = destination?.lat || 6.9344;
    const destLng = destination?.lng || 79.9839;

    const geoJsonString = routeGeometry ? JSON.stringify(routeGeometry) : 'null';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #FAFBFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .custom-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
        }
        .shop-pin {
            background-color: #2563EB;
            width: 32px;
            height: 32px;
            font-size: 16px;
        }
        .customer-pin {
            background-color: #EF4444;
            width: 34px;
            height: 34px;
            font-size: 17px;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 12px;
            padding: 4px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .popup-title {
            font-size: 13px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 2px;
        }
        .popup-sub {
            font-size: 11px;
            color: #4B5563;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var initialLat = ${hasOrigin ? originLat : (hasDest ? destLat : 6.9271)};
        var initialLng = ${hasOrigin ? originLng : (hasDest ? destLng : 79.8612)};

        var map = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([initialLat, initialLng], 12);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        var shopIcon = L.divIcon({
            className: 'custom-pin shop-pin',
            html: '🏪',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        var customerIcon = L.divIcon({
            className: 'custom-pin customer-pin',
            html: '📍',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        var shopMarker = null;
        var destMarker = null;
        var routeLayer = null;
        var markers = [];

        if (${hasOrigin}) {
            shopMarker = L.marker([${originLat}, ${originLng}], { icon: shopIcon }).addTo(map);
            shopMarker.bindPopup('<div class="popup-title">🏪 ' + ${JSON.stringify(shopName)} + '</div><div class="popup-sub">Dispatch Origin</div>');
            markers.push(shopMarker);
        }

        if (${hasDest}) {
            destMarker = L.marker([${destLat}, ${destLng}], { icon: customerIcon }).addTo(map);
            destMarker.bindPopup('<div class="popup-title">📍 ' + ${JSON.stringify(customerName)} + '</div><div class="popup-sub">' + ${JSON.stringify(deliveryAddress)} + '</div>');
            markers.push(destMarker);
        }

        var routeData = ${geoJsonString};

        if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
            routeLayer = L.geoJSON(routeData, {
                style: {
                    color: '#2563EB',
                    weight: 5,
                    opacity: 0.85,
                    lineJoin: 'round'
                }
            }).addTo(map);

            map.fitBounds(routeLayer.getBounds(), {
                padding: [40, 40],
                maxZoom: 16
            });
        } else if (markers.length > 1) {
            var group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.2));
        } else if (markers.length === 1) {
            map.setView(markers[0].getLatLng(), 14);
            markers[0].openPopup();
        }

        window.fitAll = function() {
            if (routeLayer) {
                map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
            } else if (markers.length > 1) {
                map.fitBounds(new L.featureGroup(markers).getBounds().pad(0.2));
            } else if (markers.length === 1) {
                map.setView(markers[0].getLatLng(), 14);
            }
        };

        window.focusShop = function() {
            if (shopMarker) {
                map.setView([${originLat}, ${originLng}], 15);
                shopMarker.openPopup();
            }
        };

        window.focusDestination = function() {
            if (destMarker) {
                map.setView([${destLat}, ${destLng}], 15);
                destMarker.openPopup();
            }
        };
    </script>
</body>
</html>
    `;
}
