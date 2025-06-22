package main

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Product struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Name        string             `json:"name" bson:"name"`
    Description string             `json:"description" bson:"description"`
    Price       float64            `json:"price" bson:"price"`
    SKU         string             `json:"sku" bson:"sku"`
}
