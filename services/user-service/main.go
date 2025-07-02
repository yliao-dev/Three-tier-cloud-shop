package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// --- Connect to MongoDB ---
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI environment variable is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			log.Fatalf("Failed to disconnect from MongoDB: %v", err)
		}
	}()

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}
	log.Println("Successfully connected to MongoDB!")

    // Create an Env instance containing the database client
    env := &Env{client: client}

	// --- HTTP Server Setup ---
    mux := http.NewServeMux()
	mux.Handle("/api/users/health", http.HandlerFunc(env.healthCheckHandler))
	mux.Handle("/api/users/register", http.HandlerFunc(env.registerHandler))
	mux.Handle("/api/users/login", http.HandlerFunc(env.loginHandler))

	log.Println("User service starting on port 8081...")
	if err := http.ListenAndServe(":8081", mux); err != nil {
		log.Fatalf("Could not start user service: %s\n", err)
	}
}