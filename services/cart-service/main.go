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
	cartHandler := http.HandlerFunc(env.cartHandler)

	// Use http.Handle to apply the jwtMiddleware to the cartHandler.
	// Now, no request can reach cartHandler without passing the middleware check.
	http.Handle("/api/cart", jwtMiddleware(cartHandler))

	log.Println("Cart service starting on port 8083...")
	if err := http.ListenAndServe(":8083", nil); err != nil {
		log.Fatalf("Could not start cart service: %s\n", err)
	}
}