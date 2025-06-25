package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

	// In a real application, you would also fetch product prices from the
	// catalog-service here to calculate a final total. We will omit that for now.

	// --- Step 2: Process Payment (a mock call for now) ---
	// We will assume the payment-service exists and returns success.
	// paymentSuccess, err := env.processPayment(userEmail, totalAmount)
	// if err != nil || !paymentSuccess {
	//     http.Error(w, "Payment failed", http.StatusServiceUnavailable)
	//     return
	// }

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
	// We will implement the actual HTTP call for this later.
	// For now, we assume it's successful.
	// env.clearCart(userEmail, authToken)

	// --- Step 6: Respond to the client with the created order ---
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201 Created is more appropriate now
	json.NewEncoder(w).Encode(newOrder)
}

// Helper function to call the cart-service
func (env *Env) getCartItems(userEmail, authToken string) ([]CartItem, error) {
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

	var cartItems []CartItem
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