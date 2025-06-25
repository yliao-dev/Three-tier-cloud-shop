import type { CartItem } from "./cart";

// Defines the final order object saved to the database
export interface Order {
  id: string;
  userEmail: string;
  items: CartItem[];
  status: string;
  createdAt: string; // Or Date
}
