package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/nwenisoe/menu-management/controllers"
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
		}
	}

}
func PublicMenuRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	if api == nil {
		return
	} else if api.BasePath() != "/api/v1" {
		return
	}
}
