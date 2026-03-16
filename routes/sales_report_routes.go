package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/nwenisoe/menu-management/controllers"
)

func SalesReportRoutes(router *gin.Engine) {
	router.GET("/api/v1/sales-reports", controllers.GetAllSalesReports())
	router.GET("/api/v1/sales-reports/daily", controllers.GenerateDailySalesReport())
	router.GET("/api/v1/sales-reports/daily/:date", controllers.GetDailySalesReport())
}
