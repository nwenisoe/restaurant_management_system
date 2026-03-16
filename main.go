package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/nwenisoe/menu-management/config"
	"github.com/nwenisoe/menu-management/database"
	"github.com/nwenisoe/menu-management/middlewares"
	"github.com/nwenisoe/menu-management/routes"
	"github.com/nwenisoe/menu-management/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	// Load environment variables from .env files
	err := godotenv.Load(".envs/.mongo.env")
	if err != nil {
		fmt.Printf("Warning: Could not load .envs/.mongo.env file: %v\n", err)
	}

	err = godotenv.Load(".envs/.server.env")
	if err != nil {
		fmt.Printf("Warning: Could not load .envs/.server.env file: %v\n", err)
	}

	err = utils.InitializeLogger(zapcore.DebugLevel, []string{"stdout"})
	if err != nil {
		fmt.Printf("Error initializing logger: %v\n", err)
		os.Exit(1)
	}
	log := utils.GetLogger()

	port := config.GetEnvAsInt("PORT", 8080)
	ginMode := config.GetEnv("GIN_MODE", "release")

	gin.SetMode(ginMode)
	router := gin.New()

	router.Use(middlewares.ZapLoggerMiddleware(log))
	router.Use(gin.Recovery())

	// Apply CORS middleware to all routes with more permissive settings
	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Authorization"},
		AllowCredentials: false, // Set to false when AllowAllOrigins is true
		MaxAge:           12 * time.Hour,
	}))

	// Create a completely public route group for testing
	public := router.Group("/api/v1")
	{
		public.GET("/public-invoices", func(c *gin.Context) {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")

			// Fetch real invoices from database
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			cursor, err := database.OpenCollection(database.Client, "invoice").Find(ctx, bson.M{})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoices"})
				return
			}
			defer cursor.Close(ctx)

			var allInvoices []bson.M
			if err := cursor.All(ctx, &allInvoices); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse invoices"})
				return
			}

			// Add updatedAt field if not present
			for _, invoice := range allInvoices {
				if invoice["updatedAt"] == nil {
					invoice["updatedAt"] = invoice["createdAt"]
				}
			}

			c.JSON(http.StatusOK, gin.H{"invoices": allInvoices, "totalCount": len(allInvoices)})
		})

		public.PATCH("/public-invoices/:invoiceId", func(c *gin.Context) {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")

			invoiceId := c.Param("invoiceId")
			var updateData bson.M
			if err := c.ShouldBindJSON(&updateData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
				return
			}

			// Add updatedAt timestamp
			updateData["updatedAt"] = time.Now()

			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			// Try multiple ID fields to find the invoice
			filter := bson.M{
				"$or": []bson.M{
					{"_id": invoiceId},
					{"invoiceId": invoiceId},
					{"id": invoiceId},
				},
			}
			update := bson.M{"$set": updateData}

			result, err := database.OpenCollection(database.Client, "invoice").UpdateOne(ctx, filter, update)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice", "details": err.Error()})
				return
			}

			if result.MatchedCount == 0 {
				c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found", "invoiceId": invoiceId, "filter": filter})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":       "Invoice updated successfully",
				"invoice":       updateData,
				"matchedCount":  result.MatchedCount,
				"modifiedCount": result.ModifiedCount,
			})
		})

		public.DELETE("/public-invoices/:invoiceId", func(c *gin.Context) {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")

			invoiceId := c.Param("invoiceId")

			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			// Try multiple ID fields to find the invoice
			filter := bson.M{
				"$or": []bson.M{
					{"_id": invoiceId},
					{"invoiceId": invoiceId},
					{"id": invoiceId},
				},
			}

			result, err := database.OpenCollection(database.Client, "invoice").DeleteOne(ctx, filter)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice", "details": err.Error()})
				return
			}

			if result.DeletedCount == 0 {
				c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found", "invoiceId": invoiceId, "filter": filter})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":      "Invoice deleted successfully",
				"deletedCount": result.DeletedCount,
			})
		})

		public.OPTIONS("/public-invoices", func(c *gin.Context) {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
			c.JSON(http.StatusOK, gin.H{"message": "CORS preflight successful"})
		})

		public.OPTIONS("/invoices/:invoiceId", func(c *gin.Context) {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
			c.JSON(http.StatusOK, gin.H{"message": "CORS preflight successful"})
		})
	}

	// Register all routes
	routes.HealthRoutes(router)
	routes.UserRoutes(router)
	routes.InvoiceRoutes(router)

	// Apply authentication middleware to protected routes
	router.Use(middlewares.Authentication())

	routes.MenuRoutes(router)
	routes.FoodRoutes(router)
	routes.TableRoutes(router)
	routes.OrderRoutes(router)
	routes.OrderItemRoutes(router)
	routes.SalesReportRoutes(router)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: router,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start", zap.Error(err))
		}
	}()
	log.Info(fmt.Sprintf("Server is running on port %d", port))

	<-quit
	log.Info("Shutdown signal received, exiting gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Server exited cleanly")
}
