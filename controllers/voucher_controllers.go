package controllers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nwenisoe/menu-management/database"
	"github.com/nwenisoe/menu-management/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var invoiceCollection *mongo.Collection = database.OpenCollection(database.Client, "invoice")

// GenerateInvoice creates a unique invoice for an order
func GenerateInvoice() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		orderID := c.Param("orderId")
		if orderID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID is required"})
			return
		}

		// Get order details
		var order models.Order
		err := orderCollection.FindOne(ctx, bson.M{"orderId": orderID}).Decode(&order)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		// Get table details
		var table models.Table
		err = tableCollection.FindOne(ctx, bson.M{"tableId": order.TableID}).Decode(&table)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found"})
			return
		}

		// Get order items for this order
		cursor, err := orderItemCollection.Find(ctx, bson.M{"orderId": orderID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get order items"})
			return
		}
		defer cursor.Close(ctx)

		var orderItems []models.OrderItem
		if err := cursor.All(ctx, &orderItems); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse order items"})
			return
		}

		// Get food details for each order item
		var invoiceFoodItems []models.InvoiceFoodItem
		var totalAmount float64 = 0

		for _, item := range orderItems {
			var food models.Food
			err := foodCollection.FindOne(ctx, bson.M{"foodId": item.FoodID}).Decode(&food)
			if err != nil {
				continue // Skip if food not found
			}

			// Handle pointer types
			var quantity int = 1
			if item.Quantity != nil {
				// Convert string quantity to int
				if q, err := strconv.Atoi(*item.Quantity); err == nil {
					quantity = q
				}
			}

			// Calculate subtotal
			var price float64 = 0
			if food.Price != nil {
				price = *food.Price
			}

			// Handle food name pointer
			var foodName string = ""
			if food.Name != nil {
				foodName = *food.Name
			}

			subtotal := float64(quantity) * price
			invoiceFoodItems = append(invoiceFoodItems, models.InvoiceFoodItem{
				FoodID:   *item.FoodID,
				FoodName: foodName,
				Quantity: quantity,
				Price:    price,
				Subtotal: subtotal,
			})
			totalAmount += subtotal
		}

		// Generate unique invoice ID
		invoiceID := fmt.Sprintf("INV-%d-%s", time.Now().Unix(), orderID[:8])

		// Set payment details
		//paymentStatus := "PENDING"
		paymentDueDate := time.Now().Add(24 * time.Hour) // Due in 24 hours

		// Create invoice
		invoice := models.Invoice{
			ID:             primitive.NewObjectID(),
			InvoiceID:      invoiceID,
			OrderID:        orderID,
			TableID:        *order.TableID,
			TableNumber:    table.TableNumber,
			OrderDate:      order.OrderDate,
			FoodItems:      invoiceFoodItems,
			TotalAmount:    totalAmount,
			PaymentDueDate: paymentDueDate,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		_, err = invoiceCollection.InsertOne(ctx, invoice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Invoice generated successfully",
			"invoice": invoice,
		})
	}
}

// GetInvoiceByID retrieves an invoice by ID
func GetInvoiceByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		invoiceID := c.Param("invoiceId")
		var invoice models.Invoice
		err := invoiceCollection.FindOne(ctx, bson.M{"invoiceId": invoiceID}).Decode(&invoice)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}

		c.JSON(http.StatusOK, invoice)
	}
}

// GetAllInvoices retrieves all invoices
func GetAllInvoices() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		cursor, err := invoiceCollection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoices"})
			return
		}
		defer cursor.Close(ctx)

		var invoices []models.Invoice
		if err := cursor.All(ctx, &invoices); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while parsing invoices"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"totalCount": len(invoices), "invoices": invoices})
	}
}
