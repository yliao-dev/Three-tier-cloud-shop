package main

import (
	"net/http"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Env holds all external dependencies required by the handlers.
type Env struct {
	mongoClient *mongo.Client      // To connect to MongoDB
	amqpChannel *amqp.Channel      // To publish messages to RabbitMQ
	httpClient  *http.Client       // For making service-to-service HTTP calls
}

// CartItem defines the structure for an item as returned by the cart-service.
// This struct must match the definition in the cart-service so we can correctly
// decode the JSON response from it.
type CartItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

// Order defines the structure for an order document that will be stored in MongoDB
// and published to the message queue.
type Order struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserEmail string             `json:"userEmail" bson:"userEmail"`
	Items     []CartItem         `json:"items" bson:"items"`
	Status    string             `json:"status" bson:"status"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

// contextKey is a custom type used for keys in context.WithValue to avoid collisions.
type contextKey string

// UserEmailKey is the key used to store and retrieve the user's email from the request context.
const UserEmailKey contextKey = "userEmail"