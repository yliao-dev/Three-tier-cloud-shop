package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)


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

	// Create a handler variable from our handler function
	mux := http.NewServeMux()

	// All cart routes are protected by the JWT middleware.
	mux.Handle("GET /api/cart", jwtMiddleware(http.HandlerFunc(env.getCartHandler)))
	mux.Handle("POST /api/cart/items", jwtMiddleware(http.HandlerFunc(env.addItemHandler)))
	mux.Handle("PUT /api/cart/items/{productId}", jwtMiddleware(http.HandlerFunc(env.updateItemHandler)))
	mux.Handle("DELETE /api/cart/items/{productId}", jwtMiddleware(http.HandlerFunc(env.removeItemHandler)))

	
	log.Println("Cart service starting on port 8083...")
	if err := http.ListenAndServe(":8083", nil); err != nil {
		log.Fatalf("Could not start cart service: %s\n", err)
	}
}