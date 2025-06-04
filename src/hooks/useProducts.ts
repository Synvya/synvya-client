import { useState, useEffect, useCallback } from 'react';
import { nostrService, Product } from '../lib/nostr';
import { useNostrAuth } from '../contexts/NostrAuthContext';

export const useProducts = () => {
    const { publicKey, isAuthenticated } = useNostrAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        if (!publicKey) return;

        setIsLoading(true);
        setError(null);

        try {
            const userProducts = await nostrService.getProducts(publicKey);
            setProducts(userProducts);
        } catch (err) {
            console.error('Failed to load products:', err);
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setIsLoading(false);
        }
    }, [publicKey]);

    // Load products when user is authenticated
    useEffect(() => {
        if (isAuthenticated && publicKey) {
            loadProducts();
        } else {
            setProducts([]);
        }
    }, [isAuthenticated, publicKey, loadProducts]);

    const createProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
        if (!isAuthenticated) {
            throw new Error('Must be authenticated to create products');
        }

        setIsLoading(true);
        setError(null);

        try {
            await nostrService.createProduct(productData);
            // Reload products to get the new one
            await loadProducts();
        } catch (err) {
            console.error('Failed to create product:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!isAuthenticated) {
            throw new Error('Must be authenticated to delete products');
        }

        setIsLoading(true);
        setError(null);

        try {
            await nostrService.deleteProduct(productId);
            // Remove from local state immediately for better UX
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (err) {
            console.error('Failed to delete product:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProducts = async () => {
        await loadProducts();
    };

    return {
        products,
        isLoading,
        error,
        createProduct,
        deleteProduct,
        refreshProducts,
        clearError: () => setError(null),
    };
}; 