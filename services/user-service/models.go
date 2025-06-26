package main

import "go.mongodb.org/mongo-driver/mongo"

// Env holds application-level dependencies, like the database client.
type Env struct {
	client *mongo.Client
}

// User defines the data structure for a user.
// `bson` tags are used by MongoDB for field names.
// `json` tags are used for encoding/decoding HTTP request/response bodies.
type User struct {
	Username string `json:"username" bson:"username"`
	Email    string `json:"email" bson:"email"`
	Password string `json:"password" bson:"password"`
}