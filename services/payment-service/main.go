package main

import (
	"encoding/json"
	"log"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

type OrderMessage struct {
	UserEmail string            `json:"userEmail"`
	Items     map[string]string `json:"items"`
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func main() {
	amqpURL := os.Getenv("AMQP_URL")
	if amqpURL == "" {
		amqpURL = "amqp://guest:guest@rabbitmq:5672/"
	}
	conn, err := amqp.Dial(amqpURL)
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()
	log.Println("Payment service connected to RabbitMQ!")

	err = ch.ExchangeDeclare("orders_exchange", "fanout", true, false, false, false, nil)
	failOnError(err, "Failed to declare an exchange")

	// Declare a unique queue for this service
	q, err := ch.QueueDeclare("payments_queue", true, false, false, false, nil)
	failOnError(err, "Failed to declare a queue")

	// Bind the queue to the exchange
	err = ch.QueueBind(q.Name, "", "orders_exchange", false, nil)
	failOnError(err, "Failed to bind a queue")

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	failOnError(err, "Failed to register a consumer")

	forever := make(chan struct{})
	go func() {
		for d := range msgs {
			var order OrderMessage
			err := json.Unmarshal(d.Body, &order)
			if err != nil {
				log.Printf("Error decoding JSON: %s", err)
			} else {
				log.Printf("-> Received order for user '%s'. Simulating processing payment...", order.UserEmail)
			}
		}
	}()

	log.Printf(" [*] Payment service waiting for messages. To exit press CTRL+C")
	<-forever
}