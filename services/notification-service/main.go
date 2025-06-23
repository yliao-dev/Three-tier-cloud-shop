package main

import (
	"encoding/json"
	"log"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

// OrderMessage defines the structure of the message we expect to receive
type OrderMessage struct {
	UserEmail string            `json:"userEmail"`
	Items     map[string]string `json:"items"`
}

// failOnError is a helper function to panic on error
func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func main() {
	// 1. Connect to RabbitMQ Server
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
	log.Println("Notification service connected to RabbitMQ!")

	// 2. Declare the same exchange the producer uses
	err = ch.ExchangeDeclare(
		"orders_exchange", // name
		"fanout",          // type (must match the producer)
		true,              // durable
		false,             // auto-deleted
		false,             // internal
		false,             // no-wait
		nil,               // arguments
	)
	failOnError(err, "Failed to declare an exchange")

	// 3. Declare a queue to receive messages. This is our "mailbox".
	q, err := ch.QueueDeclare(
		"notifications_queue", // name
		true,                  // durable
		false,                 // delete when unused
		false,                 // exclusive
		false,                 // no-wait
		nil,                   // arguments
	)
	failOnError(err, "Failed to declare a queue")

	// 4. Bind the queue to the exchange.
	// This tells the exchange to send messages to our queue.
	err = ch.QueueBind(
		q.Name,            // queue name
		"",                // routing key (not needed for fanout)
		"orders_exchange", // exchange name
		false,
		nil,
	)
	failOnError(err, "Failed to bind a queue")

	// 5. Start consuming messages from the queue.
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer tag (let server generate one)
		true,   // auto-ack (tells RabbitMQ to delete message once delivered)
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	// 6. Start a Go routine to process messages indefinitely.
	forever := make(chan struct{})
	go func() {
		for d := range msgs {
			var order OrderMessage
			err := json.Unmarshal(d.Body, &order)
			if err != nil {
				log.Printf("Error decoding JSON: %s", err)
			} else {
				// This is where you would put your email sending logic.
				// For now, we just print a log message.
				log.Printf("-> Received order for user '%s'. Simulating sending confirmation email.", order.UserEmail)
			}
		}
	}()

	log.Printf(" [*] Notification service waiting for messages. To exit press CTRL+C")
	<-forever // Block the main function from exiting.
}