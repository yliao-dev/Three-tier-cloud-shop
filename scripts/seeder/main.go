package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// Product struct must match the structure in your exampleData.json
type Product struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	SKU         string  `json:"sku"`
	Price       float64 `json:"price"`
	Brand       string  `json:"brand"`
	Category    string  `json:"category"`
}

// AuthResponse struct to decode the login response
type AuthResponse struct {
	Token string `json:"token"`
}

const (
	loginURL    = "http://localhost:8081/api/users/login"
	productsURL = "http://localhost:8082/api/products"
	// IMPORTANT: This user must already be registered in your database!
	loginEmail    = "test4@gmail.com"
	loginPassword = "123456"
)

func main() {
	log.Println("--- Starting Database Seeder ---")

	// --- Step 1: Authenticate to get a JWT ---
	log.Println("Authenticating to get API token...")
	token, err := getAuthToken()
	if err != nil {
		log.Fatalf("Failed to get auth token: %v. Make sure the user '%s' is registered.", err, loginEmail)
	}
	log.Println("Successfully authenticated.")

	// --- Step 2: Read product data from JSON file ---
	log.Println("Reading product data from exampleData.json...")
	log.Println(os.Getwd())
	file, err := os.ReadFile("./data.json") // Assumes the script is run from inside the seeder directory
	if err != nil {
		log.Fatalf("Failed to read seed data file: %v", err)
	}

	var products []Product
	if err := json.Unmarshal(file, &products); err != nil {
		log.Fatalf("Failed to parse seed data JSON: %v", err)
	}
	log.Printf("Found %d products to seed.", len(products))

	// --- Step 3: Loop through products and create them via API call ---
	client := &http.Client{Timeout: 10 * time.Second}
	for _, product := range products {
		log.Printf("Creating product: %s (%s)", product.Name, product.SKU)

		productJSON, err := json.Marshal(product)
		if err != nil {
			log.Printf("  [ERROR] Failed to marshal product %s: %v", product.SKU, err)
			continue
		}

		req, err := http.NewRequest("POST", productsURL, bytes.NewBuffer(productJSON))
		if err != nil {
			log.Printf("  [ERROR] Failed to create request for product %s: %v", product.SKU, err)
			continue
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("  [ERROR] Failed to send request for product %s: %v", product.SKU, err)
			continue
		}

		if resp.StatusCode != http.StatusCreated {
			log.Printf("  [ERROR] Received non-201 status for product %s: %s", product.SKU, resp.Status)
		}
		resp.Body.Close()
	}

	log.Println("--- Database Seeding Complete ---")
}

func getAuthToken() (string, error) {
	creds := map[string]string{"email": loginEmail, "password": loginPassword}
	credsJSON, _ := json.Marshal(creds)

	resp, err := http.Post(loginURL, "application/json", bytes.NewBuffer(credsJSON))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("login failed with status: %s", resp.Status)
	}

	var authResponse AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResponse); err != nil {
		return "", err
	}

	return authResponse.Token, nil
}