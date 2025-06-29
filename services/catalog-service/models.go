package main

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Env holds the 'products' collection handle.
type Env struct {
	collection *mongo.Collection
}

// Product struct now includes all fields from our seed data.
type Product struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name        string             `json:"name" bson:"name"`
	Description string             `json:"description" bson:"description"`
	SKU         string             `json:"sku" bson:"sku"`
	Price       float64            `json:"price" bson:"price"`
	Brand       string             `json:"brand" bson:"brand"`
	Category    string             `json:"category" bson:"category"`
}

type PaginatedProductsResponse struct {
	Products      []Product `json:"products"`
	TotalPages    int64     `json:"totalPages"`
	CurrentPage   int64     `json:"currentPage"`
	TotalProducts int64     `json:"totalProducts"`
}

type ContextKey string
const UserEmailKey ContextKey = "userEmail"

