package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)

// Env holds dependencies like the Redis client
type Env struct {
	rdb *redis.Client
}

// CartItem defines the structure for an item in the cart
type CartItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

func main() {
	// Get Redis address from environment variable, with a default for local dev
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis:6379" // Default address for docker-compose
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	// Ping Redis to verify connection
	if _, err := rdb.Ping(context.Background()).Result(); err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	log.Println("Cart service connected to Redis!")

	env := &Env{rdb: rdb}

	http.HandleFunc("/api/cart", env.cartHandler)

	log.Println("Cart service starting on port 8083...")
	if err := http.ListenAndServe(":8083", nil); err != nil {
		log.Fatalf("Could not start cart service: %s\n", err)
	}
}

// cartHandler will manage adding items and fetching the cart
func (env *Env) cartHandler(w http.ResponseWriter, r *http.Request) {
	// For this slice, we will only implement the POST method to add items
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var item CartItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// We will use a hardcoded userID for now.
	// In a future step, this will come from a validated JWT.
	userID := "user123"
	cartKey := "cart:" + userID

	// HIncrBy adds the quantity to the productID field in the hash.
	// This correctly handles adding new items or incrementing existing ones.
	err := env.rdb.HIncrBy(context.Background(), cartKey, item.ProductID, int64(item.Quantity)).Err()
	if err != nil {
		log.Printf("Failed to add item to cart: %v", err)
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}