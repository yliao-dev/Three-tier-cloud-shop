package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Content-Type", "application/json")
		response := map[string]string {
			"status": "ok",
			"service": "backend-api",
		}
		json.NewEncoder(w).Encode(response)
	})
	log.Println("Backend API server starting on port 8080")
	 if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	 }
}