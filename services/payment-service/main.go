package main

import (
	"log"
	"net/http"
)

// In the future, this handler will process payments with Stripe.
// For now, it's a simple placeholder that returns success.
func paymentHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("{\"status\": \"payment successful\"}"))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/payments", paymentHandler)

	log.Println("Payment service starting on port 8085...")
	if err := http.ListenAndServe(":8085", mux); err != nil {
		log.Fatalf("Could not start payment service: %s\n", err)
	}
}