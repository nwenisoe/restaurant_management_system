package routes

import (
	"github.com/nwenisoe/menu-management/controllers"

	"github.com/gin-gonic/gin"
)

func OrderRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	{
		orders := api.Group("/orders")
		{
			orders.POST("", controllers.CreateOrder())
			orders.GET("", controllers.GetAllOrders())
			orders.GET("/:orderId", controllers.GetOrderByID())
			orders.PATCH("/:orderId", controllers.UpdateOrderByID())
		}
	}
}
