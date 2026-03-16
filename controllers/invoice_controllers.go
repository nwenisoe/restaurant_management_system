package controllers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nwenisoe/menu-management/database"
	helper "github.com/nwenisoe/menu-management/helpers"
	"github.com/nwenisoe/menu-management/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type InvoiceViewFormat struct {
	InvoiceID      string
	PaymentMethod  string
	OrderID        string
	PaymentStatus  *string
	TableNumber    interface{}
	PaymentDueDate time.Time
	OrderDetails   interface{}
}

var invoiceCollection *mongo.Collection = database.OpenCollection(database.Client, "invoice")

func CreateInvoice() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var invoice models.Invoice

		if err := c.BindJSON(&invoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
			return
		}

		var order models.Order
		err := orderCollection.FindOne(ctx, bson.M{"orderId": invoice.OrderID}).Decode(&order)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		status := "PENDING"
		if invoice.PaymentStatus == nil {
			invoice.PaymentStatus = &status
		}

		now := time.Now().UTC()
		invoice.PaymentDueDate = now.AddDate(0, 0, 1)
		invoice.CreatedAt = now
		invoice.UpdatedAt = now
		invoice.ID = primitive.NewObjectID()
		invoice.InvoiceID = invoice.ID.Hex()

		if err := validate.Struct(invoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
			return
		}

		_, err = invoiceCollection.InsertOne(ctx, invoice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
			return
		}

		var createdInvoice models.Invoice
		err = invoiceCollection.FindOne(ctx, bson.M{"invoiceId": invoice.InvoiceID}).Decode(&createdInvoice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve created invoice"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Invoice created successfully", "invoice": createdInvoice})
	}
}

func GetAllInvoices() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		cursor, err := invoiceCollection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoices"})
			return
		}

		var allInvoices []models.Invoice
		if err := cursor.All(ctx, &allInvoices); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse invoices"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"invoices": allInvoices, "totalCount": len(allInvoices)})
	}
}

func GetInvoiceByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		invoiceID := c.Param("invoiceId")

		var invoice models.Invoice
		err := invoiceCollection.FindOne(ctx, bson.M{"invoiceId": invoiceID}).Decode(&invoice)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice"})
			}
			return
		}

		var order models.Order
		err = orderCollection.FindOne(ctx, bson.M{"orderId": invoice.OrderID}).Decode(&order)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve order"})
			return
		}

		var table models.Table
		err = tableCollection.FindOne(ctx, bson.M{"tableId": order.TableID}).Decode(&table)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve table"})
			return
		}

		cursor, err := orderItemCollection.Find(ctx, bson.M{"orderId": invoice.OrderID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve order items"})
			return
		}
		defer cursor.Close(ctx)

		var orderItems []models.OrderItem
		if err := cursor.All(ctx, &orderItems); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while parsing order items for order"})
			return
		}

		if len(orderItems) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "No order items found for this invoice"})
			return
		}

		invoiceView := InvoiceViewFormat{
			OrderID:        invoice.OrderID,
			PaymentDueDate: invoice.PaymentDueDate,
			PaymentMethod:  helper.GetNonNilString(invoice.PaymentMethod, "null"),
			InvoiceID:      invoice.InvoiceID,
			PaymentStatus:  invoice.PaymentStatus,
			TableNumber:    table.TableNumber,
			OrderDetails:   orderItems,
		}

		c.JSON(http.StatusOK, gin.H{"invoice": invoiceView})
	}
}

// GenerateInvoiceFromOrder creates an invoice automatically from an order
func GenerateInvoiceFromOrder() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		orderID := c.Param("orderId")
		if orderID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID is required"})
			return
		}

		// Parse request body for payment details
		var request struct {
			PaymentMethod string `json:"paymentMethod"`
			PaymentStatus string `json:"paymentStatus"`
		}

		if err := c.BindJSON(&request); err != nil {
			// If no body provided, use defaults
			request.PaymentMethod = "CASH"
			request.PaymentStatus = "PENDING"
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
		paymentDueDate := time.Now().Add(24 * time.Hour) // Due in 24 hours

		// Create invoice
		invoice := models.Invoice{
			ID:             primitive.NewObjectID(),
			InvoiceID:      invoiceID,
			OrderID:        orderID,
			TableID:        *order.TableID,
			TableNumber:    fmt.Sprintf("%d", *table.TableNumber),
			OrderDate:      order.OrderDate,
			FoodItems:      invoiceFoodItems,
			TotalAmount:    totalAmount,
			PaymentMethod:  &request.PaymentMethod,
			PaymentStatus:  &request.PaymentStatus,
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

func UpdateInvoiceByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		invoiceID := c.Param("invoiceId")
		var updateData models.Invoice

		if err := c.BindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
			return
		}

		filter := bson.M{"invoiceId": invoiceID}
		updateFields := bson.D{}

		if updateData.PaymentMethod != nil {
			updateFields = append(updateFields, bson.E{Key: "paymentMethod", Value: updateData.PaymentMethod})
		}

		if updateData.PaymentStatus != nil {
			updateFields = append(updateFields, bson.E{Key: "paymentStatus", Value: updateData.PaymentStatus})
		} else {
			defaultStatus := "PENDING"
			updateFields = append(updateFields, bson.E{Key: "paymentStatus", Value: defaultStatus})
		}

		updateFields = append(updateFields, bson.E{Key: "updatedAt", Value: time.Now().UTC()})

		update := bson.D{{Key: "$set", Value: updateFields}}

		result, err := invoiceCollection.UpdateOne(ctx, filter, update)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice: " + err.Error()})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}

		var updatedInvoice models.Invoice
		err = invoiceCollection.FindOne(ctx, filter).Decode(&updatedInvoice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated invoice: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Invoice updated successfully", "invoice": updatedInvoice})
	}
}
