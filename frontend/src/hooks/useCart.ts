import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

export type CartData = {
  [sku: string]: string;
};

// This custom hook centralizes all cart-related logic
export const useCart = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // --- Query for fetching the cart ---
  const {
    data: cart,
    isLoading,
    error,
  } = useQuery<CartData>({
    queryKey: ["cart"],
    queryFn: async (): Promise<CartData> => {
      if (!token) return {}; // Return empty cart if not logged in
      const response = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch cart data.");
      return response.json();
    },
    enabled: !!token, // Only run the query if the user is logged in
  });

  // --- Mutation for adding an item ---
  const addItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!token) throw new Error("You must be logged in.");
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Failed to add item.");
    },
    onSuccess: () => {
      // When an item is added, invalidate the cart query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      alert("Product added to cart!");
    },
    onError: (err) => alert(err.message),
  });

  // --- Mutation for removing an item ---
  const removeItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!token) throw new Error("You must be logged in.");
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error("Failed to remove item.");
    },
    onSuccess: () => {
      // When an item is removed, invalidate the cart query to refetch
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  // Expose the state and functions to the components that use this hook
  return {
    cart,
    isLoading,
    error,
    addItem: addItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
  };
};
