package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/redis/go-redis/v9"
)

type Env struct {
	rdb *redis.Client
}

func (env *Env) cartHandler(w http.ResponseWriter, r *http.Request) {
	// Get the user's email from the context. This is guaranteed to exist
	// because the jwtMiddleware has already validated it.
	userEmail, ok := r.Context().Value(UserEmailKey).(string)
	if !ok {
		http.Error(w, "Could not retrieve user identity from context", http.StatusInternalServerError)
		return
	}

	// Create a user-specific key for the Redis hash.
	cartKey := "cart:" + userEmail

	switch r.Method {
	case http.MethodPost:
		// Logic to ADD AN ITEM to the cart
		var item CartItem
		if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		// Add the item to the user's specific cart hash.
		err := env.rdb.HIncrBy(context.Background(), cartKey, item.ProductID, int64(item.Quantity)).Err()
		if err != nil {
			log.Printf("Failed to add item to cart for user %s: %v", userEmail, err)
			http.Error(w, "Failed to update cart", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)

	case http.MethodGet:
		// Logic to VIEW THE CART contents
		cartItems, err := env.rdb.HGetAll(context.Background(), cartKey).Result()
		if err != nil {
			log.Printf("Failed to get cart for user %s: %v", userEmail, err)
			http.Error(w, "Failed to retrieve cart", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cartItems)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}