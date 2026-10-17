import { db } from '../../config/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';

export async function addProduct(productData) {
    const docRef = await addDoc(collection(db, 'products'), {
        name: productData.name.trim(),
        category: productData.category.trim(),
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock, 10),
        unit: productData.unit || 'pcs',
        description: (productData.description || '').trim(),
        imageUri: productData.imageUri || null,
        shopOwnerId: productData.shopOwnerId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateProduct(productId, productData) {
    const payload = {
        name: productData.name.trim(),
        category: productData.category.trim(),
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock, 10),
        unit: productData.unit || 'pcs',
        description: (productData.description || '').trim(),
        updatedAt: serverTimestamp(),
    };

    if (productData.imageUri !== undefined) {
        payload.imageUri = productData.imageUri;
    }

    if (productData.shopOwnerId) {
        payload.shopOwnerId = productData.shopOwnerId;
    }

    await updateDoc(doc(db, 'products', productId), payload);
}

export async function updateProductStock(productId, newStock) {
    const safeStock = Math.max(0, parseInt(newStock, 10) || 0);
    await updateDoc(doc(db, 'products', productId), {
        stock: safeStock,
        updatedAt: serverTimestamp(),
    });
    return safeStock;
}

export async function adjustProductStock(productId, currentStock, delta) {
    const safeCurrent = parseInt(currentStock, 10) || 0;
    const nextStock = Math.max(0, safeCurrent + delta);
    await updateDoc(doc(db, 'products', productId), {
        stock: nextStock,
        updatedAt: serverTimestamp(),
    });
    return nextStock;
}

export async function deleteProduct(productId) {
    await deleteDoc(doc(db, 'products', productId));
}
