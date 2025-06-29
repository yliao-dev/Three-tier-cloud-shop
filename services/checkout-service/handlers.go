package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// This is the main orchestration handler for the checkout process.
func (env *Env) checkoutHandler(w http.ResponseWriter, r *http.Request) {
	// The user's identity is retrieved from the JWT middleware.
	userEmail := r.Context().Value(UserEmailKey).(string)
	authToken := r.Header.Get("Authorization")

	// --- Step 1: Get Cart Contents from cart-service ---
	cartItems, err := env.getCartItems(userEmail, authToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(cartItems) == 0 {
		http.Error(w, "Cart is empty", http.StatusBadRequest)
		return
	}
	// --- Step 2: Process Payment ---
	paymentSuccess, err := env.processPayment(userEmail)
	if err != nil || !paymentSuccess {
	    http.Error(w, "Payment failed", http.StatusServiceUnavailable)
	    return
	}

	// --- Step 3: Create a permanent Order record in MongoDB ---
	collection := env.mongoClient.Database("cloud_shop").Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	newOrder := Order{
		UserEmail: userEmail,
		Items:     cartItems,
		Status:    "Created",
		CreatedAt: time.Now(),
	}

	insertResult, err := collection.InsertOne(ctx, newOrder)
	if err != nil {
		log.Printf("Failed to create order in MongoDB: %v", err)
		http.Error(w, "Failed to save order", http.StatusInternalServerError)
		return
	}
	newOrder.ID = insertResult.InsertedID.(primitive.ObjectID)

	// --- Step 4: Publish an 'order_created' event to RabbitMQ ---
	if err := env.publishOrderCreatedEvent(newOrder); err != nil {
		// Note: In a real system, you'd need a strategy to handle this failure,
		// as the user has paid but notifications might not go out.
		log.Printf("CRITICAL: Order %s created but failed to publish event: %v", newOrder.ID.Hex(), err)
	}

	// --- Step 5: Clear the user's cart ---
	if err := env.clearCart(authToken); err != nil {
		// This is also a critical error to log. The user has paid and has an order,
		// but their cart still has items in it.
		log.Printf("CRITICAL: Order %s created but failed to clear cart: %v", newOrder.ID.Hex(), err)
	}
	// --- Step 6: Respond to the client with the created order ---
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201 Created is more appropriate now
	json.NewEncoder(w).Encode(newOrder)
}

// Helper function to call the cart-service
func (env *Env) getCartItems(_, authToken string) ([]CartItemFromService, error) {
	// Service-to-service communication happens over the internal Docker network.
	// The hostname is the service name from docker-compose.yaml.
	req, err := http.NewRequest("GET", "http://cart-service:8083/api/cart", nil)
	if err != nil {
		log.Printf("Failed to create request for cart service: %v", err)
		return nil, fmt.Errorf("internal server error")
	}

	// Forward the user's authorization token to the cart-service.
	req.Header.Add("Authorization", authToken)
	resp, err := env.httpClient.Do(req)
	if err != nil {
		log.Printf("Failed to call cart service: %v", err)
		return nil, fmt.Errorf("cart service is unavailable")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Cart service returned non-200 status: %d", resp.StatusCode)
		return nil, fmt.Errorf("failed to retrieve cart data")
	}

	var cartItems []CartItemFromService
	if err := json.NewDecoder(resp.Body).Decode(&cartItems); err != nil {
		log.Printf("Failed to decode cart response: %v", err)
		return nil, fmt.Errorf("invalid response from cart service")
	}

	return cartItems, nil
}

// Helper function to publish the message to RabbitMQ
func (env *Env) publishOrderCreatedEvent(order Order) error {
	// The exchange should be declared once on startup, but declaring it here is idempotent and safe.
	err := env.amqpChannel.ExchangeDeclare("orders_exchange", "fanout", true, false, false, false, nil)
	if err != nil {
		return err
	}

	body, err := json.Marshal(order)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return env.amqpChannel.PublishWithContext(ctx,
		"orders_exchange", // exchange
		"",                // routing key
		false,             // mandatory
		false,             // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
}



// --- HELPER FUNCTIONS ---

// processPayment is a mock function for now.
func (env *Env) processPayment(userEmail string) (bool, error) {
	log.Printf("Processing payment for user %s...", userEmail)
	// In a real system, this would make an HTTP call to the payment-service.
	// For now, we will assume it always succeeds.
	return true, nil
}

// clearCart calls the cart-service to delete all items.
func (env *Env) clearCart(authToken string) error {
	req, err := http.NewRequest("DELETE", "http://cart-service:8083/api/cart", nil)
	if err != nil {
		return fmt.Errorf("failed to create clear cart request: %w", err)
	}
	req.Header.Add("Authorization", authToken)

	resp, err := env.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call cart service for clearing cart: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("cart service returned non-204 status for clear cart: %d", resp.StatusCode)
	}

	log.Println("Successfully cleared cart.")
	return nil
}


// In services/checkout-/handler.go

// getOrdersForUserHandler retrieves all orders for the authenticated user.
func (env *Env) getOrdersForUserHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Get the user's email from the context, provided by the JWT middleware.
	userEmail, ok := r.Context().Value(UserEmailKey).(string)
	if !ok {
		http.Error(w, "Could not retrieve user from token", http.StatusInternalServerError)
		return
	}

	// 2. Get the 'orders' collection handle.
	collection := env.mongoClient.Database("cloud_shop").Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 3. Create a filter to find all documents where 'userEmail' matches.
	filter := bson.M{"userEmail": userEmail}
	
	// Optional but recommended: Sort the results by creation date, newest first.
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	// 4. Execute the query.
	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	// 5. Decode the results into a slice.
	var orders []Order
	if err = cursor.All(ctx, &orders); err != nil {
		http.Error(w, "Failed to decode orders", http.StatusInternalServerError)
		return
	}

	// Return an empty array instead of null if no orders are found.
	if orders == nil {
		orders = make([]Order, 0)
	}

	// 6. Send the response.
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}