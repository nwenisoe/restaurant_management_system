package controllers

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	helper "github.com/nwenisoe/menu-management/helpers"
	"github.com/nwenisoe/menu-management/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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

var invoiceCollection *mongo.Collection

func CreateInvoice() gin.HandlerFunc {
	return createInvoice(false)
}

func GetAllInvoices() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		findOptions := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}, {Key: "orderDate", Value: -1}})
		cursor, err := invoiceCollection.Find(ctx, bson.M{}, findOptions)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoices"})
			return
		}

		allInvoices := []models.Invoice{}
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

		var tableNumber *int
		if number, err := strconv.Atoi(invoice.TableNumber); err == nil {
			tableNumber = &number
		} else if tableID := helper.GetNonNilString(order.TableID, ""); tableID != "" {
			var table models.Table
			err := tableCollection.FindOne(ctx, bson.M{"tableId": tableID}).Decode(&table)
			if err != nil && err != mongo.ErrNoDocuments {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve table"})
				return
			}
			tableNumber = table.TableNumber
		}

		cursor, err := orderItemCollection.Find(ctx, bson.M{"orderId": invoice.OrderID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve order items"})
			return
		}
		defer cursor.Close(ctx)

		orderItems := []models.OrderItem{}
		if err := cursor.All(ctx, &orderItems); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while parsing order items for order"})
			return
		}

		invoiceView := InvoiceViewFormat{
			OrderID:        invoice.OrderID,
			PaymentDueDate: invoice.PaymentDueDate,
			PaymentMethod:  helper.GetNonNilString(invoice.PaymentMethod, "null"),
			InvoiceID:      invoice.InvoiceID,
			PaymentStatus:  invoice.PaymentStatus,
			TableNumber:    tableNumber,
			OrderDetails:   orderItems,
		}

		c.JSON(http.StatusOK, gin.H{"invoice": invoiceView})
	}
}

// GenerateInvoiceFromOrder creates an invoice automatically from an order
func GenerateInvoiceFromOrder() gin.HandlerFunc {
	return createInvoice(true)
}

func createInvoice(fromOrderRoute bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		var request struct {
			OrderID        string    `json:"orderId"`
			PaymentMethod  *string   `json:"paymentMethod"`
			PaymentStatus  *string   `json:"paymentStatus"`
			PaymentDueDate time.Time `json:"paymentDueDate"`
		}
		if err := c.ShouldBindJSON(&request); err != nil && !(fromOrderRoute && errors.Is(err, io.EOF)) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice input"})
			return
		}
		message := "Invoice created successfully"
		if fromOrderRoute {
			request.OrderID = c.Param("orderId")
			message = "Invoice generated successfully"
		}

		now := time.Now().UTC()
		id := primitive.NewObjectID()
		method, status := "CASH", "PENDING"
		invoice := models.Invoice{
			ID:             id,
			InvoiceID:      id.Hex(),
			OrderID:        request.OrderID,
			PaymentMethod:  request.PaymentMethod,
			PaymentStatus:  request.PaymentStatus,
			PaymentDueDate: request.PaymentDueDate.UTC(),
			CreatedAt:      now,
			UpdatedAt:      now,
			FoodItems:      []models.InvoiceFoodItem{},
		}
		if fromOrderRoute {
			invoice.InvoiceID = "INV-" + id.Hex()
		}
		if invoice.PaymentMethod == nil {
			invoice.PaymentMethod = &method
		}
		if invoice.PaymentStatus == nil {
			invoice.PaymentStatus = &status
		}
		if invoice.PaymentDueDate.IsZero() {
			invoice.PaymentDueDate = now.Add(24 * time.Hour)
		}
		if err := validate.Struct(invoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
			return
		}

		var order models.Order
		err := orderCollection.FindOne(ctx, bson.M{"orderId": invoice.OrderID}).Decode(&order)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load order"})
			return
		}
		invoice.OrderDate = order.OrderDate
		invoice.TableID = helper.GetNonNilString(order.TableID, "")
		if invoice.TableID != "" {
			var table models.Table
			err := tableCollection.FindOne(ctx, bson.M{"tableId": invoice.TableID}).Decode(&table)
			if err != nil && err != mongo.ErrNoDocuments {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load table"})
				return
			}
			if table.TableNumber != nil {
				invoice.TableNumber = strconv.Itoa(*table.TableNumber)
			}
		}

		cursor, err := orderItemCollection.Find(ctx, bson.M{"orderId": invoice.OrderID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load order items"})
			return
		}
		orderItems := []models.OrderItem{}
		if err := cursor.All(ctx, &orderItems); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read order items"})
			return
		}

		for _, item := range orderItems {
			// Older orders may contain portion labels or omit the quantity.
			quantity, err := strconv.Atoi(helper.GetNonNilString(item.Quantity, "1"))
			if err != nil || quantity < 1 {
				quantity = 1
			}

			foodID := helper.GetNonNilString(item.FoodID, "")
			var food models.Food
			err = foodCollection.FindOne(ctx, bson.M{"foodId": foodID}).Decode(&food)
			if err != nil && err != mongo.ErrNoDocuments {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load food details"})
				return
			}
			price := item.UnitPrice
			if price == nil {
				price = food.Price
			}
			if price == nil {
				c.JSON(http.StatusConflict, gin.H{"error": "An order item is missing its price"})
				return
			}

			subtotal := float64(quantity) * *price
			invoice.FoodItems = append(invoice.FoodItems, models.InvoiceFoodItem{
				FoodID:   foodID,
				FoodName: helper.GetNonNilString(food.Name, ""),
				Quantity: quantity,
				Price:    *price,
				Subtotal: subtotal,
			})
			invoice.TotalAmount += subtotal
		}

		if _, err := invoiceCollection.InsertOne(ctx, invoice); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": message, "invoice": invoice})
	}
}

func UpdateInvoiceByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		invoiceID := c.Param("invoiceId")
		var updateData struct {
			PaymentMethod *string                   `json:"paymentMethod"`
			PaymentStatus *string                   `json:"paymentStatus"`
			FoodItems     *[]models.InvoiceFoodItem `json:"foodItems"`
			TotalAmount   *float64                  `json:"totalAmount"`
		}

		if err := c.BindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
			return
		}

		filter := bson.M{"invoiceId": invoiceID}
		updateFields := bson.D{}

		if updateData.PaymentMethod != nil {
			switch *updateData.PaymentMethod {
			case "CARD", "CASH", "ONLINE":
				updateFields = append(updateFields, bson.E{Key: "paymentMethod", Value: updateData.PaymentMethod})
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method"})
				return
			}
		}

		if updateData.PaymentStatus != nil {
			switch *updateData.PaymentStatus {
			case "PENDING", "PAID", "CANCELLED":
				updateFields = append(updateFields, bson.E{Key: "paymentStatus", Value: updateData.PaymentStatus})
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment status"})
				return
			}
		}

		if updateData.FoodItems != nil {
			updateFields = append(updateFields, bson.E{Key: "foodItems", Value: updateData.FoodItems})
		}

		if updateData.TotalAmount != nil {
			if *updateData.TotalAmount < 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Total amount cannot be negative"})
				return
			}
			updateFields = append(updateFields, bson.E{Key: "totalAmount", Value: *updateData.TotalAmount})
		}

		if len(updateFields) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
			return
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

func DeleteInvoiceByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		invoiceID := c.Param("invoiceId")
		if invoiceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invoiceId parameter is required"})
			return
		}

		result, err := invoiceCollection.DeleteOne(ctx, bson.M{"invoiceId": invoiceID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
			return
		}

		if result.DeletedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully", "deletedCount": result.DeletedCount})
	}
}
