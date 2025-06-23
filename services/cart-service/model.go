package main

// CartItem defines the structure for an item being added to the cart.
type CartItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

// RemoveItemRequest defines the structure for a request to remove an item.
type RemoveItemRequest struct {
	ProductID string `json:"productId"`
}