package routes

import (
	"github.com/nwenisoe/menu-management/controllers"
	"github.com/nwenisoe/menu-management/middlewares"

	"github.com/gin-gonic/gin"
)

func UserRoutes(router *gin.Engine) {
	api := router.Group("/api/v1")
	{
		users := api.Group("/users")
		{
			users.POST("/signup", controllers.SignUp())
			users.POST("/login", controllers.Login())
			users.Use(middlewares.Authentication())
			users.GET("/:userId", controllers.GetUserByID())
			users.GET("/", controllers.GetAllUsers())
		}
	}
}
