package main

import (
	"log"
	"net/http"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	// Get RabbitMQ connection string from environment
	amqpURL := os.Getenv("AMQP_URL")
	if amqpURL == "" {
		amqpURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	// Connect to RabbitMQ
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %s", err)
	}
	defer conn.Close()

	// Open a channel
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %s", err)
	}
	defer ch.Close()

	log.Println("Checkout service connected to RabbitMQ!")

	env := &Env{amqpChannel: ch}

	checkoutHandler := http.HandlerFunc(env.checkoutHandler)
	http.Handle("/api/checkout", jwtMiddleware(checkoutHandler))

	log.Println("Checkout service starting on port 8084...")
	if err := http.ListenAndServe(":8084", nil); err != nil {
		log.Fatalf("Could not start checkout service: %s\n", err)
	}
}