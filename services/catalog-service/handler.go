package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Env holds dependencies, making them available to handlers.
type Env struct {
	client *mongo.Client
}

// getProductsHandler fetches all products from the database.
func (env *Env) getProductsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	collection := env.client.Database("cloud_shop").Collection("products")

	// An empty filter `bson.D{}` will match all documents in the collection.
	cursor, err := collection.Find(context.TODO(), bson.D{})
	if err != nil {
		log.Printf("Error finding products: %v", err)
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	// Decode the database results into a slice of Product structs.
	var products []Product
	if err = cursor.All(context.TODO(), &products); err != nil {
		log.Printf("Error decoding products: %v", err)
		http.Error(w, "Failed to decode products", http.StatusInternalServerError)
		return
	}

	// It's a best practice to return an empty JSON array `[]` instead of `null`
	// if no documents are found.
	if products == nil {
		products = make([]Product, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(products); err != nil {
		log.Printf("Error encoding products to JSON: %v", err)
	}
}