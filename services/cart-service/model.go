package main

import (
	"net/http"

	"github.com/redis/go-redis/v9"
)

// Env now includes an httpClient for service-to-service communication.
type Env struct {
	rdb        *redis.Client
	httpClient *http.Client
}

// Product defines the structure of data we expect from the catalog-service.
type Product struct {
	ID    		string  `json:"id"`
	Name  		string  `json:"name"`
	Price 		float64 `json:"price"`
	SKU   		string  `json:"sku"`
	Brand		string  `json:"brand"`
    Category	string  `json:"category"`
}

// AddItemRequest is the expected body when adding an item to the cart.
type AddItemRequest struct {
	ProductSKU string `json:"ProductSku"`
	Quantity  int    `json:"quantity"`
}

type UpdateItemRequest struct {
	Quantity int `json:"quantity"`
}

// CartItemDetail is the enriched structure returned to the frontend.
type CartItemDetail struct {
	ProductID   string  `json:"productId"`
	Quantity    int     `json:"quantity"`
	Name        string  `json:"name"`
	SKU       	string  `json:"sku"`
	Price       float64 `json:"price"`
	LineTotal   float64 `json:"lineTotal"`
}

// (The contextKey definitions remain the same)
type ContextKey string
const UserEmailKey ContextKey = "userEmail"