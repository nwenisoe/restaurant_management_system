package helpers

import "github.com/nwenisoe/menu-management/database"

func InitializeCollections() {
	userCollection = database.OpenCollection("user")
	foodCollection = database.OpenCollection("food")
	orderCollection = database.OpenCollection("order")
}
