package main

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Env holds dependencies, making them available to handlers.
type Env struct {
	client *mongo.Client
}

type Product struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Name        string             `json:"name" bson:"name"`
    Description string             `json:"description" bson:"description"`
    Price       float64            `json:"price" bson:"price"`
    SKU         string             `json:"sku" bson:"sku"`
}
