package main

// User defines the data structure for a user.
// `bson` tags are used by MongoDB for field names.
// `json` tags are used for encoding/decoding HTTP request/response bodies.
type User struct {
	Email    string `json:"email" bson:"email"`
	Password string `json:"password" bson:"password"`
}