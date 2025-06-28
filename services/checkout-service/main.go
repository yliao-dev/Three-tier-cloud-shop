package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// The checkout workflow will be:

// Receive a checkout request from an authenticated user.
// Communicate with the cart-service to retrieve the user's cart contents.
// Calculate a total price.
// Communicate with the payment-service to process the payment.
// If payment is successful, save a permanent Order record to the MongoDB database.
// Publish an order_created event to RabbitMQ so other services (like notification-service) can react to it.
// Communicate with the cart-service again to clear the user's cart.
// Return a success response.

func main() {
	// --- Dependency 1: MongoDB Connection ---
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
	// Ping the primary to verify the connection.
	if err := mongoClient.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatalf("Could not ping MongoDB: %v", err)
	}
	log.Println("Checkout service connected to MongoDB!")

	// --- Dependency 2: RabbitMQ Connection ---
	amqpURL := os.Getenv("AMQP_URL")
	if amqpURL == "" {
		amqpURL = "amqp://guest:guest@rabbitmq:5672/"
	}
	amqpConn, err := amqp.Dial(amqpURL)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %s", err)
	}
	defer amqpConn.Close()
	amqpChannel, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a RabbitMQ channel: %s", err)
	}
	defer amqpChannel.Close()
	log.Println("Checkout service connected to RabbitMQ!")

	// --- Dependency 3: HTTP Client for Service-to-Service calls ---
	httpClient := &http.Client{
		Timeout: 5 * time.Second, // It's crucial to have a timeout
	}

	// --- Dependency Injection: Create the Env struct with all dependencies ---
	env := &Env{
		mongoClient: mongoClient,
		amqpChannel: amqpChannel,
		httpClient:  httpClient,
	}

	// --- Routing: Use the new Go 1.22+ ServeMux ---
	mux := http.NewServeMux()
	mux.Handle("POST /api/checkout", jwtMiddleware(http.HandlerFunc(env.checkoutHandler)))
    mux.Handle("GET /api/orders", jwtMiddleware(http.HandlerFunc(env.getOrdersForUserHandler)))

	// --- Start Server ---
	log.Println("Checkout service starting on port 8084...")
	if err := http.ListenAndServe(":8084", mux); err != nil {
		log.Fatalf("Could not start checkout service: %s\n", err)
	}
}