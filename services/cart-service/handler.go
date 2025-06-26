package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

// getProductDetails is a helper to call the catalog-service
// user need to fetch accurate, most update-to-date data from catalog-service
// like price, name
func (env *Env) getProductDetails(productID string) (*Product, error) {
	// The hostname 'catalog-service' comes from docker-compose.yaml
	url := fmt.Sprintf("http://catalog-service:8082/api/products/sku/%s", productID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := env.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("catalog-service returned status %d", resp.StatusCode)
	}

	var product Product
	if err := json.NewDecoder(resp.Body).Decode(&product); err != nil {
		return nil, err
	}

	return &product, nil
}

// getCartHandler now orchestrates calls to Redis and the catalog-service.
func (env *Env) getCartHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value(UserEmailKey).(string)
	cartKey := "cart:" + userEmail

	// 1. Get basic cart data (productID -> quantity) from Redis
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

	// 2. Fetch full product details for each item from the catalog-service
	detailedItems := make([]CartItemDetail, 0, len(cartItemsMap))
	for productID, quantityStr := range cartItemsMap {
		quantity, _ := strconv.Atoi(quantityStr)

		// Make a service-to-service HTTP call
		product, err := env.getProductDetails(productID)
		if err != nil {
			// If a product in the cart is not found in the catalog, log it and skip.
			log.Printf("Could not get details for product %s: %v", productID, err)
			continue
		}

		// 3. Combine the data into our rich response object
		detailedItems = append(detailedItems, CartItemDetail{
			ProductID: product.ID,
			Quantity:  quantity,
			Name:      product.Name,
			SKU:       product.SKU,
			Price:     product.Price,
			LineTotal: product.Price * float64(quantity),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(detailedItems)
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

	var item CartItemDetail
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