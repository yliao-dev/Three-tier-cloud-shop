package main

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Env holds dependencies, making them available to handlers.
type Env struct {
	collection *mongo.Collection
}

type Product struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Name        string             `json:"name" bson:"name"`
    Description string             `json:"description" bson:"description"`
    Price       float64            `json:"price" bson:"price"`
    SKU         string             `json:"sku" bson:"sku"`
}

// contextKey is a custom type to avoid key collisions in context.
type contextKey string

// UserEmailKey is the key for the user's email in the request context.
const UserEmailKey contextKey = "userEmail"