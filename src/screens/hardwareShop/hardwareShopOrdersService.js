import { db } from '../../config/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { DEFAULT_HARDWARE_ORDERS } from './hardwareShopHelpers';

export async function ensureSeedHardwareOrders(shopOwnerId) {
    // Dummy order generation removed per requirements.
    // Newly registered Hardware Shop Owners see an empty Orders interface until actual House Owners place orders.
    return;
}

export async function updateHardwareOrderStatus(orderId, status, additionalData = {}) {
    await updateDoc(doc(db, 'hardwareOrders', orderId), {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData,
    });
}

export async function addHardwareOrderNote(orderId, note) {
    await updateDoc(doc(db, 'hardwareOrders', orderId), {
        shopNotes: note,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteHardwareOrder(orderId) {
    await deleteDoc(doc(db, 'hardwareOrders', orderId));
}
