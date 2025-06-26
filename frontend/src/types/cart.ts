// In frontend/src/types/cart.ts

// This is the enriched cart item object returned by the cart-service API
export interface CartItemDetail {
  productId: string;
  quantity: number;
  name: string;
  sku: string;
  price: number;
  lineTotal: number;
}

// This type is still useful for *sending* data to the backend
export interface CartItemRequest {
  productId: string;
  quantity: number;
}
