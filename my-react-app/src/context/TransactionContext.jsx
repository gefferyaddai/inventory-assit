import { createContext, useContext, useState } from "react";
import { mockTransactions } from "../services/mockData";

const TransactionContext = createContext(null);

export function TransactionProvider({ children }) {
    const [cart, setCart] = useState([]);

    // item: { id, productId, variantId, productName, variantLabel, price, qty, warehouseId }
    function addToCart(item) {
        setCart((prev) => {
            const existing = prev.find(
                (c) => c.variantId === item.variantId && c.warehouseId === item.warehouseId
            );
            if (existing) {
                return prev.map((c) =>
                    c.variantId === item.variantId && c.warehouseId === item.warehouseId
                        ? { ...c, qty: c.qty + item.qty }
                        : c
                );
            }
            return [...prev, { ...item, id: crypto.randomUUID() }];
        });
    }

    function removeFromCart(id) {
        setCart((prev) => prev.filter((c) => c.id !== id));
    }

    function clearCart() {
        setCart([]);
    }

    // type: 'sale' | 'receipt' | 'adjustment' | 'return'
    // warehouseId: string
    // Returns the created transaction object
    function submitTransaction(type, warehouseId) {
        if (cart.length === 0) {
            throw new Error("Cart is empty. Add at least one item before submitting.");
        }

        const newTransaction = {
            id: `TXN-${Date.now()}`,
            type,
            warehouseId,
            items: cart.map((c) => ({
                productId: c.productId,
                variantId: c.variantId,
                productName: c.productName,
                variantLabel: c.variantLabel,
                qty: c.qty,
                price: c.price,
            })),
            date: new Date().toISOString(),
            createdAt: Date.now(),
        };

        // Append to the in-memory mock array so other parts of the app see the update
        mockTransactions.push(newTransaction);

        clearCart();
        return newTransaction;
    }

    return (
        <TransactionContext.Provider
            value={{ cart, addToCart, removeFromCart, clearCart, submitTransaction }}
        >
            {children}
        </TransactionContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransaction() {
    const ctx = useContext(TransactionContext);
    if (!ctx) {
        throw new Error("useTransaction must be used inside <TransactionProvider>");
    }
    return ctx;
}