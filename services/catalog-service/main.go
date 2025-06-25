package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

func main() {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI environment variable is not set.")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	if err := mongoClient.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatalf("Could not ping MongoDB: %v", err)
	}
	log.Println("Catalog service connected to MongoDB!")

	// Get a handle to the collection and create the Env for dependency injection
	collection := mongoClient.Database("cloud_shop").Collection("products")
	env := &Env{collection: collection}

	mux := http.NewServeMux()

	// --- Define Routes ---
	// Public "read" endpoints - NO middleware
	mux.HandleFunc("GET /api/products", env.getProductsHandler)
	mux.HandleFunc("GET /api/products/{id}", env.getProductByIDHandler)

	// Protected "write" endpoints - WRAPPED in jwtMiddleware
	mux.Handle("POST /api/products", jwtMiddleware(http.HandlerFunc(env.createProductHandler)))
	mux.Handle("PUT /api/products/{id}", jwtMiddleware(http.HandlerFunc(env.updateProductHandler)))
	mux.Handle("DELETE /api/products/{id}", jwtMiddleware(http.HandlerFunc(env.deleteProductHandler)))

	// --- Start Server ---
	log.Println("Catalog service starting on port 8082...")
	// Correctly pass the 'mux' router to ListenAndServe
	if err := http.ListenAndServe(":8082", mux); err != nil {
		log.Fatalf("Could not start catalog service: %s\n", err)
	}
}