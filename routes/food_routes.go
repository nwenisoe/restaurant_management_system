package routes

import (
	"github.com/nwenisoe/menu-management/controllers"

	"github.com/gin-gonic/gin"
)

func FoodRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	{
		foods := api.Group("/foods")
		{
			foods.POST("", controllers.CreateFood())
			foods.GET("", controllers.GetAllFoodItems())
			foods.GET("/:foodId", controllers.GetFoodByID())
			foods.PATCH("/:foodId", controllers.UpdateFoodByID())
		}
	}
}
