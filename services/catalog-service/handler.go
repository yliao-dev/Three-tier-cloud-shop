package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// getProductsHandler fetches all products from the database.
func (env *Env) getProductsHandler(w http.ResponseWriter, r *http.Request) {
	// An empty filter `bson.D{}` will match all documents in the collection.
	cursor, err := env.collection.Find(context.TODO(), bson.D{})
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

func (env *Env) getProductByIDHandler(w http.ResponseWriter, r *http.Request) {
	// Get the ID from the URL path.
	productIDString := r.PathValue("id")
	objID, err := primitive.ObjectIDFromHex(productIDString)
	if err != nil {
		http.Error(w, "Invalid product ID format", http.StatusBadRequest)
		return
	}
	filter := bson.M{"_id": objID}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Execute the FindOne query.
	var product Product
	err = env.collection.FindOne(ctx, filter).Decode(&product)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			http.Error(w, "Product not found", http.StatusNotFound)
		} else {
			log.Printf("Error finding product: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}
		// Write the result back to the client as JSON.
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(product); err != nil {
		log.Printf("Error encoding product to JSON: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}

}


// getProductBySKUHandler finds a single product by its SKU.
func (env *Env) getProductBySKUHandler(w http.ResponseWriter, r *http.Request) {
	// The SKU is a path parameter, just like the ID was.
	productSKU := r.PathValue("sku")
	if productSKU == "" {
		http.Error(w, "SKU must be provided", http.StatusBadRequest)
		return
	}

	// The filter now uses the "sku" field instead of "_id".
	filter := bson.M{"sku": productSKU}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var product Product
	err := env.collection.FindOne(ctx, filter).Decode(&product)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			http.Error(w, "Product with that SKU not found", http.StatusNotFound)
		} else {
			log.Printf("Error finding product by SKU %s: %v", productSKU, err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}



func (env *Env) createProductHandler(w http.ResponseWriter, r *http.Request) {
	var newProduct Product
	err := json.NewDecoder(r.Body).Decode(&newProduct)
	if err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if newProduct.Name == "" || newProduct.SKU == "" || newProduct.Price <= 0 {
		http.Error(w, "Name, SKU, and a positive Price are required", http.StatusBadRequest)
		return
	}


	var existingProduct Product
	err = env.collection.FindOne(context.TODO(), bson.M{"sku": newProduct.SKU}).Decode(&existingProduct)
	// If FindOne returns no error, it means a product with that SKU was found.
	if err == nil {
		http.Error(w, "Product with this SKU already exists", http.StatusConflict) // 409 Conflict is the correct status code
		return
	}
	// We expect a "document not found" error. Any other error is a server problem.
	if err != mongo.ErrNoDocuments {
		log.Printf("Error checking for existing SKU: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}


	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	insertResult, err := env.collection.InsertOne(ctx, newProduct)
	if err != nil {
		log.Printf("Error creating product: %v", err)
		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return
	}

	// The ID is returned in the `insertResult.InsertedID`. We must type-assert it.
	newProduct.ID = insertResult.InsertedID.(primitive.ObjectID)

	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(newProduct); err != nil {
		log.Printf("Error encoding created product to JSON: %v", err)
	}

}


func (env *Env) updateProductHandler(w http.ResponseWriter, r *http.Request) {
	ProductIDString := r.PathValue("id")
	objID, err := primitive.ObjectIDFromHex(ProductIDString)
	if err != nil {
		http.Error(w, "Invalid product ID format", http.StatusBadRequest)
		return
	}
	
	var updatedProduct Product 
	if err := json.NewDecoder(r.Body).Decode(&updatedProduct); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if updatedProduct.Name == "" || updatedProduct.SKU == "" || updatedProduct.Price <= 0 {
		http.Error(w, "Name, SKU, and a positive Price are required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()


	// Define the filter to find the document to replace.
	filter := bson.M{"_id": objID}

	result, err := env.collection.ReplaceOne(ctx, filter, updatedProduct)
	if err != nil {
		log.Printf("Error updating product: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	// If MatchedCount is 0, it means no document with that ID was found.
	if result.MatchedCount == 0 {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
    
    // Set the ID on the returned object since the decoded one won't have it.
    updatedProduct.ID = objID
	if err := json.NewEncoder(w).Encode(updatedProduct); err != nil {
		log.Printf("Error encoding updated product to JSON: %v", err)
	}

}

func (env *Env) deleteProductHandler(w http.ResponseWriter, r *http.Request) {
	ProductIDString := r.PathValue("id")
	objID, err := primitive.ObjectIDFromHex(ProductIDString)
	if err != nil {
		http.Error(w, "Invalid product ID format", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()


	// Define the filter to find the document to delete.
	filter := bson.M{"_id": objID}

	result, err := env.collection.DeleteOne(ctx, filter)
	if err != nil {
		log.Printf("Error deleting product: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if result.DeletedCount == 0 {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}
		w.WriteHeader(http.StatusNoContent)

}