package controllers

import "github.com/nwenisoe/menu-management/database"

func InitializeCollections() {
	foodCollection = database.OpenCollection("food")
	invoiceCollection = database.OpenCollection("invoice")
	menuCollection = database.OpenCollection("menu")
	orderItemCollection = database.OpenCollection("orderItem")
	orderCollection = database.OpenCollection("order")
	salesReportCollection = database.OpenCollection("sales_report")
	tableCollection = database.OpenCollection("table")
	userCollection = database.OpenCollection("user")
}
