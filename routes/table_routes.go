package routes

import (
	"github.com/nwenisoe/menu-management/controllers"

	"github.com/gin-gonic/gin"
)

func TableRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	{
		tables := api.Group("/tables")
		{
			tables.POST("", controllers.CreateTable())
			tables.GET("", controllers.GetAllTables())
			tables.GET("/:tableId", controllers.GetTableByID())
			tables.PATCH("/:tableId", controllers.UpdateTableByID())
		}
	}
}
