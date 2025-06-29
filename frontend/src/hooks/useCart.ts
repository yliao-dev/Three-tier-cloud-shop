import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // Import toast
import apiClient from "../api/client";
import { useAuthContext } from "../context/AuthContext";
import type { CartItemDetail, CartItemRequest } from "../types/cart";

export const useCart = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: cart,
    isLoading,
    error,
  } = useQuery<CartItemDetail[]>({
    queryKey: ["cart", user?.email],
    queryFn: async (): Promise<CartItemDetail[]> => {
      const response = await apiClient.get("/cart");
      return response.data;
    },
    enabled: !!user,
  });

  const addItemMutation = useMutation({
    mutationFn: (item: CartItemRequest) => {
      return apiClient.post(`/cart/items`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item added to cart");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to add item."),
  });

  const updateItemMutation = useMutation({
    mutationFn: (item: CartItemRequest) => {
      return apiClient.put(`/cart/items/${item.productSku}`, {
        quantity: item.quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to update quantity."),
  });

  const removeItemMutation = useMutation({
    mutationFn: (productSku: string) => {
      return apiClient.delete(`/cart/items/${productSku}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed from cart");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to remove item."),
  });

  const clearCartMutation = useMutation({
    mutationFn: () => {
      return apiClient.delete("/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Cart has been cleared");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to clear cart."),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => {
      return apiClient.post("/checkout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Checkout successful!");
      navigate("/");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Checkout failed."),
  });

  return {
    cart,
    isLoading,
    error,
    addItem: (productSku: string) =>
      addItemMutation.mutate({ productSku, quantity: 1 }),
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
