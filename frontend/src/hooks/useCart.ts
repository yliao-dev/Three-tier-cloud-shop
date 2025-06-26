import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuthContext } from "../context/AuthContext";
import type { CartItemDetail, CartItemRequest } from "../types/cart";

// This custom hook centralizes all cart-related logic
export const useCart = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // --- Query for fetching the cart ---
  const {
    data: cart,
    isLoading,
    error,
  } = useQuery<CartItemDetail[]>({
    queryKey: ["cart"],
    queryFn: async (): Promise<CartItemDetail[]> => {
      // Use the apiClient. The '/cart' will be appended to the baseURL.
      const response = await apiClient.get("/cart");
      return response.data;
    },
    enabled: !!user,
  });

  // --- Mutation for adding an item ---
  const addItemMutation = useMutation({
    mutationFn: async (item: { productId: string; quantity: number }) => {
      // Correct endpoint: POST /api/cart/items
      return apiClient.post(`/cart/items`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      alert("Product added to cart!");
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Failed to add item."),
  });

  const updateItemMutation = useMutation({
    mutationFn: (item: CartItemRequest) => {
      // Correct RESTful endpoint: PUT /api/cart/items/{productId}
      return apiClient.put(`/cart/items/${item.productId}`, {
        quantity: item.quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Failed to update item quantity."),
  });

  // --- Mutation for removing an item ---
  const removeItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Correct RESTful endpoint: DELETE /api/cart/items/{productId}
      return apiClient.delete(`/cart/items/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Failed to remove item."),
  });

  const clearCartMutation = useMutation({
    mutationFn: () => {
      // Correct RESTful endpoint: DELETE /api/cart
      return apiClient.delete("/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Failed to clear cart."),
  });

  // --- Mutation for checking out ---
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // Correct endpoint: POST /api/checkout with an empty body.
      // The backend now orchestrates getting the cart, payment, etc.
      return apiClient.post("/checkout");
    },
    onSuccess: () => {
      alert("Checkout successful! Your order is being processed.");
      queryClient.invalidateQueries({ queryKey: ["cart"] }); // Refetch the (now empty) cart
      navigate("/");
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Checkout failed."),
  });

  // Expose the state and functions to the components that use this hook
  return {
    cart,
    isLoading,
    error,
    addItem: (productId: string) =>
      addItemMutation.mutate({ productId, quantity: 1 }), // Simplified interface
    removeItem: removeItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    checkout: checkoutMutation.mutate,

    isAddingItem: addItemMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    isCheckingOut: checkoutMutation.isPending,
  };
};
