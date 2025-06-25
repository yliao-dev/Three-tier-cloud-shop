package main

import "github.com/redis/go-redis/v9"

type Env struct {
	rdb *redis.Client
}
// CartItem defines the structure for an item being added to the cart.
type CartItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

// RemoveItemRequest defines the structure for a request to remove an item.
type RemoveItemRequest struct {
	ProductID string `json:"productId"`
}

// ContextKey is a custom type to avoid key collisions in context.
type ContextKey string

// UserEmailKey is the specific key we will use to store the user's email.
const UserEmailKey ContextKey = "userEmail"

