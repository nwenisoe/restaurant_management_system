package controllers

import (
	"context"
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

// Define missing models locally since they were in voucher_model.go
type FoodSalesItem struct {
	FoodID        string  `json:"foodId" bson:"foodId"`
	FoodName      string  `json:"foodName" bson:"foodName"`
	TotalQuantity int     `json:"totalQuantity" bson:"totalQuantity"`
	TotalSales    float64 `json:"totalSales" bson:"totalSales"`
	Price         float64 `json:"price" bson:"price"`
}

type DailySalesReport struct {
	ID          primitive.ObjectID `json:"id" bson:"_id"`
	ReportDate  time.Time          `json:"reportDate" bson:"reportDate"`
	TotalSales  float64            `json:"totalSales" bson:"totalSales"`
	TotalOrders int                `json:"totalOrders" bson:"totalOrders"`
	FoodSales   []FoodSalesItem    `json:"foodSales" bson:"foodSales"`
	CreatedAt   time.Time          `json:"createdAt" bson:"createdAt"`
}

var salesReportCollection *mongo.Collection = database.OpenCollection(database.Client, "sales_report")

// GenerateDailySalesReport generates a daily sales report
func GenerateDailySalesReport() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Get date from query parameter (default to today)
		dateParam := c.Query("date")
		var reportDate time.Time
		var err error

		if dateParam == "" {
			// Default to today
			now := time.Now()
			reportDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		} else {
			// Parse date from parameter
			reportDate, err = time.Parse("2006-01-02", dateParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
				return
			}
		}

		// Set start and end of day
		startOfDay := time.Date(reportDate.Year(), reportDate.Month(), reportDate.Day(), 0, 0, 0, 0, reportDate.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)

		// Get all orders for the day
		cursor, err := orderCollection.Find(ctx, bson.M{
			"orderDate": bson.M{
				"$gte": startOfDay,
				"$lt":  endOfDay,
			},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get orders"})
			return
		}
		defer cursor.Close(ctx)

		var orders []models.Order
		if err := cursor.All(ctx, &orders); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse orders"})
			return
		}

		// Get all order items for these orders
		orderIDs := make([]string, len(orders))
		for i, order := range orders {
			orderIDs[i] = order.OrderID
		}

		orderItemsCursor, err := orderItemCollection.Find(ctx, bson.M{
			"orderId": bson.M{"$in": orderIDs},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get order items"})
			return
		}
		defer orderItemsCursor.Close(ctx)

		var orderItems []models.OrderItem
		if err := orderItemsCursor.All(ctx, &orderItems); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse order items"})
			return
		}

		// Aggregate sales by food item
		foodSalesMap := make(map[string]FoodSalesItem)
		var totalSales float64 = 0

		for _, item := range orderItems {
			// Get food details
			var food models.Food
			err := foodCollection.FindOne(ctx, bson.M{"foodId": item.FoodID}).Decode(&food)
			if err != nil {
				continue
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

			// Update food sales map
			foodID := *item.FoodID
			if existing, exists := foodSalesMap[foodID]; exists {
				existing.TotalQuantity += quantity
				existing.TotalSales += subtotal
				foodSalesMap[foodID] = existing
			} else {
				foodSalesMap[foodID] = FoodSalesItem{
					FoodID:        foodID,
					FoodName:      foodName,
					TotalQuantity: quantity,
					TotalSales:    subtotal,
					Price:         price,
				}
			}

			totalSales += subtotal
		}

		// Convert map to slice
		var foodSales []FoodSalesItem
		for _, item := range foodSalesMap {
			foodSales = append(foodSales, item)
		}

		// Create sales report
		salesReport := DailySalesReport{
			ID:          primitive.NewObjectID(),
			ReportDate:  reportDate,
			TotalSales:  totalSales,
			TotalOrders: len(orders),
			FoodSales:   foodSales,
			CreatedAt:   time.Now(),
		}

		// Check if report already exists for this date
		var existingReport DailySalesReport
		err = salesReportCollection.FindOne(ctx, bson.M{
			"reportDate": bson.M{
				"$gte": startOfDay,
				"$lt":  endOfDay,
			},
		}).Decode(&existingReport)

		if err == nil {
			// Update existing report
			update := bson.M{
				"$set": bson.M{
					"totalSales":  totalSales,
					"totalOrders": len(orders),
					"foodSales":   foodSales,
					"updatedAt":   time.Now(),
				},
			}
			_, err = salesReportCollection.UpdateOne(ctx, bson.M{"_id": existingReport.ID}, update)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update sales report"})
				return
			}
		} else {
			// Create new report
			_, err = salesReportCollection.InsertOne(ctx, salesReport)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sales report"})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"message":     "Daily sales report generated successfully",
			"reportDate":  reportDate.Format("2006-01-02"),
			"totalSales":  totalSales,
			"totalOrders": len(orders),
			"foodSales":   foodSales,
		})
	}
}

// GetDailySalesReport retrieves a daily sales report by date
func GetDailySalesReport() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		dateParam := c.Query("date")
		if dateParam == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Date parameter is required"})
			return
		}

		reportDate, err := time.Parse("2006-01-02", dateParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}

		// Set start and end of day
		startOfDay := time.Date(reportDate.Year(), reportDate.Month(), reportDate.Day(), 0, 0, 0, 0, reportDate.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)

		var report DailySalesReport
		err = salesReportCollection.FindOne(ctx, bson.M{
			"reportDate": bson.M{
				"$gte": startOfDay,
				"$lt":  endOfDay,
			},
		}).Decode(&report)

		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sales report not found for this date"})
			return
		}

		c.JSON(http.StatusOK, report)
	}
}

// GetAllSalesReports retrieves all sales reports
func GetAllSalesReports() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		cursor, err := salesReportCollection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sales reports"})
			return
		}
		defer cursor.Close(ctx)

		var reports []DailySalesReport
		if err := cursor.All(ctx, &reports); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while parsing sales reports"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"totalCount": len(reports), "reports": reports})
	}
}
