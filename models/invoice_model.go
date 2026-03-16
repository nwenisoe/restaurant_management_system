package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Invoice struct {
	ID             primitive.ObjectID `json:"id" bson:"_id"`
	InvoiceID      string             `json:"invoiceId" bson:"invoiceId"`
	OrderID        string             `json:"orderId" bson:"orderId" validate:"required"`
	TableID        string             `json:"tableId" bson:"tableId"`
	TableNumber    string             `json:"tableNumber" bson:"tableNumber"`
	OrderDate      time.Time          `json:"orderDate" bson:"orderDate"`
	FoodItems      []InvoiceFoodItem  `json:"foodItems" bson:"foodItems"`
	TotalAmount    float64            `json:"totalAmount" bson:"totalAmount"`
	PaymentMethod  *string            `json:"paymentMethod" bson:"paymentMethod" validate:"eq=CARD|eq=CASH|eq=ONLINE"`
	PaymentStatus  *string            `json:"paymentStatus" bson:"paymentStatus" validate:"required,eq=PENDING|eq=PAID"`
	PaymentDueDate time.Time          `json:"paymentDueDate" bson:"paymentDueDate" validate:"required"`
	CreatedAt      time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt      time.Time          `json:"updatedAt" bson:"updatedAt"`
}

type InvoiceFoodItem struct {
	FoodID   string  `json:"foodId" bson:"foodId"`
	FoodName string  `json:"foodName" bson:"foodName"`
	Quantity int     `json:"quantity" bson:"quantity"`
	Price    float64 `json:"price" bson:"price"`
	Subtotal float64 `json:"subtotal" bson:"subtotal"`
}
