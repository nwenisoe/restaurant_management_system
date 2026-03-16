package routes

import (
	"net/http"
	"time"

	"github.com/nwenisoe/menu-management/controllers"

	"github.com/gin-gonic/gin"
)

func InvoiceRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	{
		// Add a simple test endpoint for CORS debugging
		api.GET("/test-cors", func(c *gin.Context) {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
			c.JSON(http.StatusOK, gin.H{"message": "CORS test successful", "timestamp": time.Now().Unix()})
		})

		// Add a simple invoices test endpoint
		api.GET("/test-invoices", func(c *gin.Context) {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
			c.JSON(http.StatusOK, gin.H{"invoices": []interface{}{}, "totalCount": 0, "message": "Test invoices endpoint working"})
		})

		invoices := api.Group("/invoices")
		{
			// Handle OPTIONS preflight requests
			invoices.OPTIONS("", func(c *gin.Context) {
				c.Header("Access-Control-Allow-Origin", "*")
				c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
				c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
				c.JSON(http.StatusOK, gin.H{"message": "CORS preflight successful"})
			})

			// Add CORS headers to all invoice responses
			invoices.Use(func(c *gin.Context) {
				c.Header("Access-Control-Allow-Origin", "*")
				c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
				c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
				c.Next()
			})

			invoices.POST("", controllers.CreateInvoice())
			invoices.GET("", controllers.GetAllInvoices())
			invoices.GET("/:invoiceId", controllers.GetInvoiceByID())
			invoices.PATCH("/:invoiceId", controllers.UpdateInvoiceByID())
		}

		// Auto-generate invoice from order
		api.POST("/orders/:orderId/invoice", controllers.GenerateInvoiceFromOrder())
	}
}
