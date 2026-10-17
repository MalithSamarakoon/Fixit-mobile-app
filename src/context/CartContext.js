import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    const addToCart = (product, quantity = 1) => {
        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex((item) => item.id === product.id);
            if (existingIndex > -1) {
                const nextCart = [...prevCart];
                const currentQty = nextCart[existingIndex].qty;
                const maxStock = Number(product.stock) || 999;
                const newQty = Math.min(maxStock, currentQty + quantity);
                nextCart[existingIndex] = {
                    ...nextCart[existingIndex],
                    qty: newQty,
                };
                return nextCart;
            } else {
                return [
                    ...prevCart,
                    {
                        id: product.id,
                        name: product.name,
                        price: Number(product.price) || 0,
                        unit: product.unit || 'pcs',
                        category: product.category || 'General',
                        imageUri: product.imageUri || null,
                        stock: Number(product.stock) || 0,
                        shopOwnerId: product.shopOwnerId || null,
                        shopName: product.shopName || 'FixIt Hardware Partner',
                        qty: Math.min(Number(product.stock) || 1, quantity),
                    },
                ];
            }
        });
    };

    const updateCartQty = (productId, newQty) => {
        setCart((prevCart) => {
            if (newQty <= 0) {
                return prevCart.filter((item) => item.id !== productId);
            }
            return prevCart.map((item) => {
                if (item.id === productId) {
                    const maxStock = item.stock || 999;
                    return { ...item, qty: Math.min(maxStock, newQty) };
                }
                return item;
            });
        });
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

    const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                updateCartQty,
                removeFromCart,
                clearCart,
                cartCount,
                cartSubtotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
