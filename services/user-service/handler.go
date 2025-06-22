package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// Env holds application-level dependencies, like the database client.
type Env struct {
	client *mongo.Client
}

// healthCheckHandler provides a simple health check endpoint.
func (env *Env) healthCheckHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "user-service"})
}

// registerHandler handles new user registration.
func (env *Env) registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPassword)

	collection := env.client.Database("cloud_shop").Collection("users")
	_, err = collection.InsertOne(context.TODO(), user)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}


func (env *Env) loginHandler(w http.ResponseWriter, r *http.Request) {
	var err error
	if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var creds User
	if err = json.NewDecoder(r.Body).Decode(&creds); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// 1. Find the user in the databse by email
	var storedUser User
	collection := env.client.Database("cloud_shop").Collection("users")
	if err = collection.FindOne(context.TODO(), bson.M{"email": creds.Email}).Decode(&storedUser); err != nil {
		// If user not found, return a generic error. Do not reveal if the email exists.
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}
	// 2. Compare the provided password with the stored hash
	if err = bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(creds.Password)); err != nil{
		 // Passwords don't match
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
	}
	// 3. Create and sign a JWT
	expirationTime := time.Now().Add(24* time.Hour)
	claims := &jwt.RegisteredClaims{
		Subject: storedUser.Email,
		ExpiresAt: jwt.NewNumericDate(expirationTime),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	jwtSecret := os.Getenv("JWT_SECRET")
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
        return
	}
	// 4. Send the token back to the client
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"token": tokenString})

}