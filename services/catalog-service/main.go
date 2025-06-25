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
	// 1. Get the MongoDB connection string from the environment variable
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI environment variable is not set")
	}

	// 2. Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	// 3. Ping the database to verify the connection
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}
	log.Println("Catalog service connected to MongoDB!")

	// 4. Create an instance of Env to hold dependencies (like the db client)
	env := &Env{client: client}
	mux := http.NewServeMux()

	// 5. Register the handler function for your API endpoint
	mux.HandleFunc("GET /api/products", env.getProductsHandler)
	mux.HandleFunc("GET /api/products/{id}", env.getProductByIDHandler)
	mux.HandleFunc("POST /api/products", env.createProductHandler)
	mux.HandleFunc("PUT /api/products/{id}", env.updateProductHandler)
	mux.HandleFunc("DELETE /api/products/{id}", env.deleteProductHandler)

	// 6. Start the HTTP server on port 8082
	log.Println("Catalog service starting on port 8082...")
	if err := http.ListenAndServe(":8082", nil); err != nil {
		log.Fatalf("Could not start catalog service: %s\n", err)
	}
}