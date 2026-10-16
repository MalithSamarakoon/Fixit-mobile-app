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
    if (!shopOwnerId) return;

    const q = query(collection(db, 'hardwareOrders'), where('shopOwnerId', '==', shopOwnerId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return;

    await Promise.all(
        DEFAULT_HARDWARE_ORDERS.map((order) =>
            addDoc(collection(db, 'hardwareOrders'), {
                ...order,
                shopOwnerId,
                createdAt: serverTimestamp(),
            })
        )
    );
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
