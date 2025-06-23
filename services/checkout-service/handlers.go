package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Env struct {
	amqpChannel *amqp.Channel
}

// CheckoutRequest defines what the frontend will send
type CheckoutRequest struct {
	Items map[string]string `json:"items"` // e.g., {"SKU-123": "2"}
}

// OrderMessage defines the message we will publish to RabbitMQ
type OrderMessage struct {
	UserEmail string            `json:"userEmail"`
	Items     map[string]string `json:"items"`
}

func (env *Env) checkoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userEmail := r.Context().Value(UserEmailKey).(string)

	var req CheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create the message to be published
	message := OrderMessage{
		UserEmail: userEmail,
		Items:     req.Items,
	}
	messageBody, err := json.Marshal(message)
	if err != nil {
		http.Error(w, "Failed to create order message", http.StatusInternalServerError)
		return
	}

	// Declare an exchange to publish to.
	// A "fanout" exchange broadcasts to all queues bound to it.
	err = env.amqpChannel.ExchangeDeclare(
		"orders_exchange", // name
		"fanout",          // type
		true,              // durable
		false,             // auto-deleted
		false,             // internal
		false,             // no-wait
		nil,               // arguments
	)
	if err != nil {
		log.Printf("Failed to declare an exchange: %s", err)
		http.Error(w, "Failed to connect to messaging system", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Publish the message to the exchange
	err = env.amqpChannel.PublishWithContext(ctx,
		"orders_exchange", // exchange
		"",                // routing key (not used for fanout)
		false,             // mandatory
		false,             // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        messageBody,
		})
	if err != nil {
		log.Printf("Failed to publish a message: %s", err)
		http.Error(w, "Failed to publish message", http.StatusInternalServerError)
		return
	}

	log.Printf("Published message for user: %s", userEmail)
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"message": "Order accepted for processing."})
}