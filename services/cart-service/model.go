package main

// CartItem defines the structure for an item being added to the cart.
type CartItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}