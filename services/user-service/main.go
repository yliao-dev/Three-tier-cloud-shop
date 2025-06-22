// services/user-service/main.go

package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/api/users/health", func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Content-Type", "application/json")
		response := map[string]string {
			"status": "ok",
			"service": "user-service",
		}
		json.NewEncoder(w).Encode(response)
	})
	log.Println("Backend API server starting on port 8081")
	 if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	 }
}