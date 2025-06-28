import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useAuthContext } from "../context/AuthContext";
import type { Order } from "../types/order";

const fetchOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>("/orders");
  console.log(response);
  return response.data;
};

export const useOrders = () => {
  const { user } = useAuthContext();

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["orders", user?.email], // Query key is unique to the user
    queryFn: fetchOrders,
    enabled: !!user, // Only run if the user is logged in
  });

  return { orders, isLoading, error };
};
