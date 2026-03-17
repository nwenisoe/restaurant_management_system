package routes

import (
	"github.com/nwenisoe/menu-management/controllers"

	"github.com/gin-gonic/gin"
)

func MenuRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	{
		menus := api.Group("/menus")
		{
			menus.POST("", controllers.CreateMenu())
			menus.GET("", controllers.GetAllMenus())
			menus.GET("/:menuId", controllers.GetMenuByID())
			menus.PATCH("/:menuId", controllers.UpdateMenuByID())
			menus.DELETE("/:menuId", controllers.DeleteMenuByID())
		}
	}
}
