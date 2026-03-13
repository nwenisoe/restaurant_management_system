package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/nwenisoe/menu-management/controllers"
)

func HealthRoutes(router *gin.Engine) {
	health := router.Group("/health")
	{
		health.GET("/router", controllers.GetRouterHealth)
		health.GET("/database", controllers.GetDatabaseHealth)
	}
}
