package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	log.Println("Successfully connected to Redis!")

	// Create a shared HTTP client with a timeout for service-to-service calls.
	httpClient := &http.Client{
		Timeout: 5 * time.Second,
	}

	// Inject both dependencies into the Env struct.
	env := &Env{
		rdb:        rdb,
		httpClient: httpClient,
	}

	mux := http.NewServeMux()

	// Routes remain the same, but the getCartHandler will now be much smarter.
	mux.Handle("GET /api/cart", jwtMiddleware(http.HandlerFunc(env.getCartHandler)))
	mux.Handle("POST /api/cart/items", jwtMiddleware(http.HandlerFunc(env.addItemHandler)))
	mux.Handle("PUT /api/cart/items/{productSku}", jwtMiddleware(http.HandlerFunc(env.updateItemHandler)))
	mux.Handle("DELETE /api/cart/items/{productSku}", jwtMiddleware(http.HandlerFunc(env.removeItemHandler)))
	mux.Handle("DELETE /api/cart", jwtMiddleware(http.HandlerFunc(env.clearCartHandler)))

	log.Println("Cart service starting on port 8083...")
	if err := http.ListenAndServe(":8083", mux); err != nil {
		log.Fatalf("Could not start cart service: %s\n", err)
	}
}