package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

// getCartHandler retrieves all items from the user's cart.
// Endpoint: GET /api/cart
func (env *Env) getCartHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail

	// HGetAll returns all fields and values of the hash stored at key.
	cartItemsMap, err := env.rdb.HGetAll(context.Background(), cartKey).Result()
	if err != nil {
		log.Printf("Failed to get cart for user %s: %v", userEmail, err)
		http.Error(w, "Failed to retrieve cart", http.StatusInternalServerError)
		return
	}

	// It's good practice to return an empty list instead of null.
	if len(cartItemsMap) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("[]"))
		return
	}

	// Convert the map[string]string from Redis into a slice of CartItem structs.
	var products []CartItem
	for productID, quantityStr := range cartItemsMap {
		quantity, _ := strconv.Atoi(quantityStr)
		products = append(products, CartItem{ProductID: productID, Quantity: quantity})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(products)
}

// addItemHandler adds an item to the cart. If the item exists, its quantity is incremented.
// Endpoint: POST /api/cart/items
func (env *Env) addItemHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail

	var item CartItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate the item data.
	if item.ProductID == "" || item.Quantity <= 0 {
		http.Error(w, "ProductID and a positive Quantity are required", http.StatusBadRequest)
		return
	}

	// HIncrBy increments the number stored at field in the hash stored at key by increment.
	// This neatly handles both adding a new item and incrementing an existing one.
	err := env.rdb.HIncrBy(context.Background(), cartKey, item.ProductID, int64(item.Quantity)).Err()
	if err != nil {
		log.Printf("Failed to add item to cart for user %s: %v", userEmail, err)
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// removeItemHandler removes a specific item completely from the cart.
// Endpoint: DELETE /api/cart/items/{productId}
func (env *Env) removeItemHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail
	productID := r.PathValue("productId") // Get productID from URL

	// HDel removes the specified fields from the hash stored at key.
	err := env.rdb.HDel(context.Background(), cartKey, productID).Err()
	if err != nil {
		log.Printf("Failed to remove item from cart for user %s: %v", userEmail, err)
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// updateItemHandler sets the quantity for a specific item. (This is new)
// Endpoint: PUT /api/cart/items/{productId}
func (env *Env) updateItemHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail
	productID := r.PathValue("productId")

	var item CartItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if item.Quantity <= 0 {
		// If quantity is zero or less, remove the item instead.
		env.rdb.HDel(context.Background(), cartKey, productID)
	} else {
		// HSet sets the specified fields to their respective values in the hash stored at key.
		err := env.rdb.HSet(context.Background(), cartKey, productID, item.Quantity).Err()
		if err != nil {
			log.Printf("Failed to update item in cart for user %s: %v", userEmail, err)
			http.Error(w, "Failed to update cart", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}