package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
)

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("{\"status\":\"ok\"}"))
}

func (env *Env) getCartHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail

	// 1. Get basic cart data (SKU -> quantity) from Redis
	cartItemsMap, err := env.rdb.HGetAll(context.Background(), cartKey).Result()
	if err != nil {
		http.Error(w, "Failed to retrieve cart", http.StatusInternalServerError)
		return
	}

	if len(cartItemsMap) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}

	// 2. Collect all SKUs into a slice
	skusToFetch := make([]string, 0, len(cartItemsMap))
	for sku := range cartItemsMap {
		skusToFetch = append(skusToFetch, sku)
	}
	sort.Strings(skusToFetch) // Sort for a predictable order

	// 3. Make a SINGLE batch API call to the catalog-service
	products, err := env.getProductDetailsBatch(skusToFetch)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create a map for easy lookup of product details by SKU
	productDetailsMap := make(map[string]Product)
	for _, p := range products {
		productDetailsMap[p.SKU] = p
	}

	// 4. Combine the data into our rich response object
	detailedItems := make([]CartItemDetail, 0, len(cartItemsMap))
	for _, sku := range skusToFetch {
		quantityStr := cartItemsMap[sku]
		quantity, _ := strconv.Atoi(quantityStr)

		if product, ok := productDetailsMap[sku]; ok {
			detailedItems = append(detailedItems, CartItemDetail{
				ProductID: product.ID,
				Quantity:  quantity,
				Name:      product.Name,
				SKU:       product.SKU,
				Price:     product.Price,
				LineTotal: product.Price * float64(quantity),
			})
		} else {
			log.Printf("Orphaned cart item: SKU %s found in cart but not in catalog.", sku)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(detailedItems)
}

func (env *Env) getProductDetailsBatch(skus []string) ([]Product, error) {
    // Read the catalog service URL from an environment variable.
    // This decouples the code from the environment.
    catalogServiceURL := os.Getenv("CATALOG_SERVICE_URL")
    if catalogServiceURL == "" {
        // Provide a local default for development.
        catalogServiceURL = "http://localhost:8082/api/products/batch-get"
    }

    requestBody, err := json.Marshal(map[string][]string{"skus": skus})
    if err != nil {
        return nil, fmt.Errorf("failed to create request body: %w", err)
    }

    req, err := http.NewRequest("POST", catalogServiceURL, bytes.NewBuffer(requestBody))
    if err != nil {
        return nil, fmt.Errorf("failed to create batch request: %w", err)
    }
    req.Header.Set("Content-Type", "application/json")

    resp, err := env.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("failed to call catalog service: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("catalog-service returned non-200 status: %d", resp.StatusCode)
    }

    var products []Product
    if err := json.NewDecoder(resp.Body).Decode(&products); err != nil {
        return nil, fmt.Errorf("failed to decode product details: %w", err)
    }

    return products, nil
}

// addItemHandler now uses the specific request struct
func (env *Env) addItemHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail

	var item AddItemRequest // Use the new request struct
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if item.ProductSKU == "" || item.Quantity <= 0 {
		http.Error(w, "ProductID and a positive Quantity are required", http.StatusBadRequest)
		return
	}

	err := env.rdb.HIncrBy(context.Background(), cartKey, item.ProductSKU, int64(item.Quantity)).Err()
	if err != nil {
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
// removeItemHandler removes a specific item completely from the cart.
// Endpoint: DELETE /api/cart/items/{productId}
func (env *Env) removeItemHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail
	productSKU := r.PathValue("productSku") // Get productID from URL

	// HDel removes the specified fields from the hash stored at key.
	err := env.rdb.HDel(context.Background(), cartKey, productSKU).Err()
	if err != nil {
		log.Printf("Failed to remove item from cart for user %s: %v", userEmail, err)
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// updateItemHandler sets the quantity for a specific item.
// Endpoint: PUT /api/cart/items/{productId}
func (env *Env) updateItemHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail
	productSKU := r.PathValue("productSku")

	var item UpdateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if item.Quantity <= 0 {
		// If quantity is zero or less, remove the item instead.
		env.rdb.HDel(context.Background(), cartKey, productSKU)
	} else {
		// HSet sets the specified fields to their respective values in the hash stored at key.
		err := env.rdb.HSet(context.Background(), cartKey, productSKU, item.Quantity).Err()
		if err != nil {
			log.Printf("Failed to update item in cart for user %s: %v", userEmail, err)
			http.Error(w, "Failed to update cart", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}


// clearCartHandler deletes all items from a user's cart.
// Endpoint: DELETE /api/cart
func (env *Env) clearCartHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail

	// DEL deletes the entire key (the user's cart hash).
	err := env.rdb.Del(context.Background(), cartKey).Err()
	if err != nil {
		log.Printf("Failed to clear cart for user %s: %v", userEmail, err)
		http.Error(w, "Failed to update cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}