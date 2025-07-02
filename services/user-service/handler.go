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

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("{\"status\":\"ok\"}"))
}

func (env *Env) registerHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Decode user data from request body
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 2. Validate input
	if user.Username == "" || user.Email == "" || user.Password == "" {
		http.Error(w, "Username, email, and password are required", http.StatusBadRequest)
		return
	}

	collection := env.client.Database("cloud_shop").Collection("users")

	// 3. Check if user already exists
	var existingUser User
	err := collection.FindOne(context.TODO(), bson.M{"email": user.Email}).Decode(&existingUser)
	// If err is nil, a user was found, which is a conflict.
	if err == nil {
		http.Error(w, "User with this email already exists", http.StatusConflict)
		return
	}
	// If the error is anything other than "document not found", it's a server error.
	if err != mongo.ErrNoDocuments {
		http.Error(w, "Error checking for existing user", http.StatusInternalServerError)
		return
	}

	// 4. Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPassword)

	// 5. Insert the new user (including username)
	_, err = collection.InsertOne(context.TODO(), user)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	expirationTime := time.Now().Add(24* time.Hour)


	// 6. Generate and return a JWT for auto-login
	claims := jwt.MapClaims{
		"email":    user.Email,
		"username": user.Username,
		"exp":      jwt.NewNumericDate(expirationTime), 
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	jwtSecret := os.Getenv("JWT_SECRET")
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// 7. Respond with the token
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
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
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}
	// 3. Create and sign a JWT
	expirationTime := time.Now().Add(24* time.Hour)

	claims := jwt.MapClaims{
		"email":      storedUser.Email,                       
		"username": storedUser.Username,                     
		"exp":      jwt.NewNumericDate(expirationTime), 
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
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