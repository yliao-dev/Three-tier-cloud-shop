import type { CartItemDetail } from "./cart";

// Defines the final order object saved to the database
export interface Order {
  id: string;
  userEmail: string;
  items: CartItemDetail[];
  status: string;
  createdAt: string;
}
