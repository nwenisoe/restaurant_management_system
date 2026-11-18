package controllers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/nwenisoe/menu-management/models"
	"github.com/nwenisoe/menu-management/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"
)

type OrderItemPack struct {
	TableID    string `json:"tableId" binding:"required"`
	OrderItems []struct {
		FoodID   string `json:"foodId" binding:"required"`
		Quantity string `json:"quantity" binding:"required"`
	} `json:"orderItems" binding:"required,min=1,dive"`
}

var orderItemCollection *mongo.Collection

func CreateOrderItem() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 100*time.Second)
		defer cancel()

		var orderItemPack OrderItemPack

		if err := c.ShouldBindJSON(&orderItemPack); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		var table models.Table
		err := tableCollection.FindOne(ctx, bson.M{"tableId": orderItemPack.TableID}).Decode(&table)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found", "tableId": orderItemPack.TableID})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify table"})
			return
		}

		now := time.Now().UTC()
		id := primitive.NewObjectID()
		order := models.Order{
			ID:        id,
			OrderID:   id.Hex(),
			OrderDate: now,
			CreatedAt: now,
			UpdatedAt: now,
			TableID:   &orderItemPack.TableID,
		}

		var orderItemsToBeInserted []interface{}
		var createdOrderItems []models.OrderItem

		for _, item := range orderItemPack.OrderItems {
			quantity, err := strconv.Atoi(item.Quantity)
			if err != nil || quantity < 1 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Quantity must be a positive integer"})
				return
			}
			var food models.Food
			err = foodCollection.FindOne(ctx, bson.M{"foodId": item.FoodID}).Decode(&food)
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "Food item not found", "foodId": item.FoodID})
				return
			}
			if err != nil || food.Price == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load food price"})
				return
			}

			unitPrice := food.Price

			orderItem := models.OrderItem{
				ID:          primitive.NewObjectID(),
				Quantity:    &item.Quantity,
				UnitPrice:   unitPrice,
				CreatedAt:   now,
				UpdatedAt:   now,
				FoodID:      &item.FoodID,
				OrderItemID: primitive.NewObjectID().Hex(),
				OrderID:     order.OrderID,
			}

			orderItemsToBeInserted = append(orderItemsToBeInserted, orderItem)
			createdOrderItems = append(createdOrderItems, orderItem)
		}

		// Write items first so a failed batch cannot publish an incomplete order.
		if _, err = orderItemCollection.InsertMany(ctx, orderItemsToBeInserted); err == nil {
			_, err = orderCollection.InsertOne(ctx, order)
		}
		if err != nil {
			cleanupCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			// The order write may have succeeded before a connection error was returned.
			if _, cleanupErr := orderCollection.DeleteOne(cleanupCtx, bson.M{"_id": id}); cleanupErr != nil {
				utils.GetLogger().Error("Failed to roll back order", zap.String("orderId", order.OrderID), zap.Error(cleanupErr))
			} else if _, cleanupErr := orderItemCollection.DeleteMany(cleanupCtx, bson.M{"orderId": order.OrderID}); cleanupErr != nil {
				utils.GetLogger().Error("Failed to roll back order items", zap.String("orderId", order.OrderID), zap.Error(cleanupErr))
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order and items"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order and items created successfully", "orderId": order.OrderID, "totalCount": len(createdOrderItems), "orderItems": createdOrderItems})
	}
}

func GetAllOrderItems() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		cursor, err := orderItemCollection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error occurred while retrieving order items"})
			return
		}
		defer cursor.Close(ctx)

		allOrderItems := []models.OrderItem{}
		if err := cursor.All(ctx, &allOrderItems); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error occurred while decoding order items"})
			return
		}

		if len(allOrderItems) == 0 {
			c.JSON(http.StatusOK, gin.H{"totalCount": 0, "orderItems": []models.OrderItem{}})
			return
		}

		c.JSON(http.StatusOK, gin.H{"totalCount": len(allOrderItems), "orderItems": allOrderItems})
	}
}

func GetOrderItemByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		orderItemId := c.Param("orderItemId")
		var orderItem models.OrderItem

		err := orderItemCollection.FindOne(ctx, bson.M{"orderItemId": orderItemId}).Decode(&orderItem)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order item not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error occurred while retrieving the order item"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"orderItem": orderItem})
	}
}

func GetOrderItemsByOrderID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		orderId := c.Param("orderId")

		cursor, err := orderItemCollection.Find(ctx, bson.M{"orderId": orderId})
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

		c.JSON(http.StatusOK, gin.H{"totalCount": len(orderItems), "orderItems": orderItems})
	}
}

func UpdateOrderItemByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var orderItem models.OrderItem
		orderItemId := c.Param("orderItemId")

		if err := c.ShouldBindJSON(&orderItem); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		filter := bson.M{"orderItemId": orderItemId}
		updateObj := bson.D{}

		if orderItem.UnitPrice != nil {
			updateObj = append(updateObj, bson.E{Key: "unitPrice", Value: *orderItem.UnitPrice})
		}

		if orderItem.Quantity != nil {
			quantity, err := strconv.Atoi(*orderItem.Quantity)
			if err != nil || quantity < 1 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Quantity must be a positive integer"})
				return
			}
			updateObj = append(updateObj, bson.E{Key: "quantity", Value: *orderItem.Quantity})
		}

		if orderItem.FoodID != nil {
			updateObj = append(updateObj, bson.E{Key: "foodId", Value: *orderItem.FoodID})
		}

		if len(updateObj) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
			return
		}

		updateObj = append(updateObj, bson.E{Key: "updatedAt", Value: time.Now().UTC()})
		opts := options.FindOneAndUpdate().SetReturnDocument(options.After)

		var updatedOrderItem models.OrderItem
		err := orderItemCollection.FindOneAndUpdate(ctx, filter, bson.D{{Key: "$set", Value: updateObj}}, opts).Decode(&updatedOrderItem)

		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order item not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order item"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order item updated successfully", "orderItem": updatedOrderItem})
	}
}
