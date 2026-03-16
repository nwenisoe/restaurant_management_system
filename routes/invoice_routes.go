package routes

import (
	"github.com/nwenisoe/menu-management/controllers"

	"github.com/gin-gonic/gin"
)

func InvoiceRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	{
		invoices := api.Group("/invoices")
		{
			invoices.POST("", controllers.CreateInvoice())
			invoices.GET("", controllers.GetAllInvoices())
			invoices.GET("/:invoiceId", controllers.GetInvoiceByID())
			invoices.PATCH("/:invoiceId", controllers.UpdateInvoiceByID())
		}

		// Auto-generate invoice from order
		api.POST("/orders/:orderId/invoice", controllers.GenerateInvoiceFromOrder())
	}
}
