package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/nwenisoe/menu-management/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type demoMenu struct {
	ID       primitive.ObjectID
	MenuID   string
	Name     string
	Category string
}

type demoFood struct {
	ID     primitive.ObjectID
	FoodID string
	Name   string
	Price  float64
	Image  string
	MenuID string
}

type demoTable struct {
	ID       primitive.ObjectID
	TableID  string
	Number   int
	Capacity int
}

type demoOrder struct {
	ID        primitive.ObjectID
	OrderID   string
	TableID   string
	OrderDate time.Time
	Items     []demoOrderItem
	Status    string
	Method    string
}

type demoOrderItem struct {
	FoodID   string
	Quantity int
}

func main() {
	_ = godotenv.Load(".envs/.mongo.env")
	_ = godotenv.Load(".envs/.server.env")

	mongoURI := config.GetEnv("MONGODB_URI", "mongodb://root:example@localhost:27017/restaurant?authSource=admin")
	databaseName := config.GetEnv("MONGODB_DATABASE", "restaurant")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("connect MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("ping MongoDB: %v", err)
	}

	db := client.Database(databaseName)
	clearCollections(ctx, db)
	seedDemo(ctx, db)
}

func clearCollections(ctx context.Context, db *mongo.Database) {
	collections := []string{"sales_report", "invoice", "orderItem", "order", "food", "table", "menu"}
	for _, name := range collections {
		result, err := db.Collection(name).DeleteMany(ctx, bson.M{})
		if err != nil {
			log.Fatalf("clear %s: %v", name, err)
		}
		fmt.Printf("Cleared %-12s %d record(s)\n", name, result.DeletedCount)
	}
}

func seedDemo(ctx context.Context, db *mongo.Database) {
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 10, 0, 0, 0, time.UTC)
	yesterday := today.AddDate(0, 0, -1)
	twoDaysAgo := today.AddDate(0, 0, -2)
	menuStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	menuEnd := menuStart.AddDate(0, 3, 0)

	menus := []demoMenu{
		newMenu("Sunrise Breakfast", "Breakfast"),
		newMenu("Market Lunch", "Lunch"),
		newMenu("Evening Dinner", "Dinner"),
		newMenu("Coffee & Drinks", "Drinks"),
		newMenu("Dessert Bar", "Dessert"),
	}
	insertMenus(ctx, db.Collection("menu"), menus, menuStart, menuEnd, now)

	menuID := map[string]string{}
	for _, menu := range menus {
		menuID[menu.Name] = menu.MenuID
	}

	foods := []demoFood{
		newFood("Avocado Toast", 8.50, "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80", menuID["Sunrise Breakfast"]),
		newFood("Berry Pancakes", 9.25, "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80", menuID["Sunrise Breakfast"]),
		newFood("Grilled Chicken Bowl", 12.75, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80", menuID["Market Lunch"]),
		newFood("Tomato Basil Pasta", 13.40, "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80", menuID["Market Lunch"]),
		newFood("Crispy Salmon", 18.90, "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=900&q=80", menuID["Evening Dinner"]),
		newFood("Steak Rice Plate", 21.50, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80", menuID["Evening Dinner"]),
		newFood("Iced Latte", 4.75, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80", menuID["Coffee & Drinks"]),
		newFood("Chocolate Tart", 6.95, "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80", menuID["Dessert Bar"]),
	}
	insertFoods(ctx, db.Collection("food"), foods, now)

	foodID := map[string]string{}
	foodPrice := map[string]float64{}
	for _, food := range foods {
		foodID[food.Name] = food.FoodID
		foodPrice[food.FoodID] = food.Price
	}

	tables := []demoTable{
		newTable(1, 2),
		newTable(2, 4),
		newTable(3, 4),
		newTable(4, 6),
		newTable(5, 8),
		newTable(6, 2),
	}
	insertTables(ctx, db.Collection("table"), tables, now)

	orders := []demoOrder{
		newOrder("ORD-DEMO-1001", tables[0].TableID, today.Add(30*time.Minute), "PAID", "CASH", []demoOrderItem{
			{FoodID: foodID["Avocado Toast"], Quantity: 2},
			{FoodID: foodID["Iced Latte"], Quantity: 2},
		}),
		newOrder("ORD-DEMO-1002", tables[2].TableID, today.Add(2*time.Hour), "PAID", "CARD", []demoOrderItem{
			{FoodID: foodID["Grilled Chicken Bowl"], Quantity: 2},
			{FoodID: foodID["Chocolate Tart"], Quantity: 1},
		}),
		newOrder("ORD-DEMO-1003", tables[4].TableID, today.Add(4*time.Hour), "PENDING", "CASH", []demoOrderItem{
			{FoodID: foodID["Crispy Salmon"], Quantity: 1},
			{FoodID: foodID["Tomato Basil Pasta"], Quantity: 2},
		}),
		newOrder("ORD-DEMO-1004", tables[1].TableID, yesterday.Add(3*time.Hour), "PAID", "ONLINE", []demoOrderItem{
			{FoodID: foodID["Berry Pancakes"], Quantity: 3},
			{FoodID: foodID["Iced Latte"], Quantity: 3},
		}),
		newOrder("ORD-DEMO-1005", tables[3].TableID, twoDaysAgo.Add(7*time.Hour), "CANCELLED", "CARD", []demoOrderItem{
			{FoodID: foodID["Steak Rice Plate"], Quantity: 1},
		}),
	}

	foodByID := map[string]demoFood{}
	for _, food := range foods {
		foodByID[food.FoodID] = food
	}

	insertOrders(ctx, db.Collection("order"), orders, now)
	insertOrderItems(ctx, db.Collection("orderItem"), orders, foodPrice, now)
	insertInvoices(ctx, db.Collection("invoice"), orders, tables, foodByID, now)
	insertSalesReport(ctx, db.Collection("sales_report"), today, orders, foodByID, now)

	fmt.Println("Demo reset complete: 5 menus, 8 foods, 6 tables, 5 orders, 5 invoices, 1 sales report")
}

func newMenu(name, category string) demoMenu {
	id := primitive.NewObjectID()
	return demoMenu{ID: id, MenuID: id.Hex(), Name: name, Category: category}
}

func newFood(name string, price float64, image string, menuID string) demoFood {
	id := primitive.NewObjectID()
	return demoFood{ID: id, FoodID: id.Hex(), Name: name, Price: price, Image: image, MenuID: menuID}
}

func newTable(number, capacity int) demoTable {
	id := primitive.NewObjectID()
	return demoTable{ID: id, TableID: id.Hex(), Number: number, Capacity: capacity}
}

func newOrder(orderID, tableID string, orderDate time.Time, status, method string, items []demoOrderItem) demoOrder {
	return demoOrder{
		ID:        primitive.NewObjectID(),
		OrderID:   orderID,
		TableID:   tableID,
		OrderDate: orderDate,
		Status:    status,
		Method:    method,
		Items:     items,
	}
}

func insertMenus(ctx context.Context, collection *mongo.Collection, menus []demoMenu, startDate, endDate, now time.Time) {
	docs := make([]interface{}, 0, len(menus))
	for _, menu := range menus {
		docs = append(docs, bson.M{
			"_id":       menu.ID,
			"menuId":    menu.MenuID,
			"name":      menu.Name,
			"category":  menu.Category,
			"startDate": startDate,
			"endDate":   endDate,
			"createdAt": now,
			"updatedAt": now,
		})
	}
	mustInsert(ctx, collection, docs)
}

func insertFoods(ctx context.Context, collection *mongo.Collection, foods []demoFood, now time.Time) {
	docs := make([]interface{}, 0, len(foods))
	for _, food := range foods {
		docs = append(docs, bson.M{
			"_id":       food.ID,
			"foodId":    food.FoodID,
			"name":      food.Name,
			"price":     food.Price,
			"foodImage": food.Image,
			"menuId":    food.MenuID,
			"createdAt": now,
			"updatedAt": now,
		})
	}
	mustInsert(ctx, collection, docs)
}

func insertTables(ctx context.Context, collection *mongo.Collection, tables []demoTable, now time.Time) {
	docs := make([]interface{}, 0, len(tables))
	for _, table := range tables {
		docs = append(docs, bson.M{
			"_id":            table.ID,
			"tableId":        table.TableID,
			"tableNumber":    table.Number,
			"numberOfGuests": table.Capacity,
			"createdAt":      now,
			"updatedAt":      now,
		})
	}
	mustInsert(ctx, collection, docs)
}

func insertOrders(ctx context.Context, collection *mongo.Collection, orders []demoOrder, now time.Time) {
	docs := make([]interface{}, 0, len(orders))
	for _, order := range orders {
		tableID := order.TableID
		docs = append(docs, bson.M{
			"_id":       order.ID,
			"orderId":   order.OrderID,
			"tableId":   tableID,
			"orderDate": order.OrderDate,
			"createdAt": order.OrderDate,
			"updatedAt": now,
		})
	}
	mustInsert(ctx, collection, docs)
}

func insertOrderItems(ctx context.Context, collection *mongo.Collection, orders []demoOrder, foodPrice map[string]float64, now time.Time) {
	docs := []interface{}{}
	for _, order := range orders {
		for index, item := range order.Items {
			id := primitive.NewObjectID()
			quantity := fmt.Sprintf("%d", item.Quantity)
			unitPrice := foodPrice[item.FoodID]
			docs = append(docs, bson.M{
				"_id":         id,
				"orderItemId": fmt.Sprintf("%s-ITEM-%d", order.OrderID, index+1),
				"orderId":     order.OrderID,
				"foodId":      item.FoodID,
				"quantity":    quantity,
				"unitPrice":   unitPrice,
				"createdAt":   order.OrderDate,
				"updatedAt":   now,
			})
		}
	}
	mustInsert(ctx, collection, docs)
}

func insertInvoices(ctx context.Context, collection *mongo.Collection, orders []demoOrder, tables []demoTable, foodByID map[string]demoFood, now time.Time) {
	tableNumberByID := map[string]int{}
	for _, table := range tables {
		tableNumberByID[table.TableID] = table.Number
	}

	docs := make([]interface{}, 0, len(orders))
	for index, order := range orders {
		foodItems := []bson.M{}
		totalAmount := 0.0
		for _, item := range order.Items {
			food := foodByID[item.FoodID]
			subtotal := food.Price * float64(item.Quantity)
			totalAmount += subtotal
			foodItems = append(foodItems, bson.M{
				"foodId":   food.FoodID,
				"foodName": food.Name,
				"quantity": item.Quantity,
				"price":    food.Price,
				"subtotal": subtotal,
			})
		}

		id := primitive.NewObjectID()
		docs = append(docs, bson.M{
			"_id":            id,
			"invoiceId":      fmt.Sprintf("INV-DEMO-%04d", index+1),
			"orderId":        order.OrderID,
			"tableId":        order.TableID,
			"tableNumber":    fmt.Sprintf("%d", tableNumberByID[order.TableID]),
			"orderDate":      order.OrderDate,
			"foodItems":      foodItems,
			"totalAmount":    totalAmount,
			"paymentMethod":  order.Method,
			"paymentStatus":  order.Status,
			"paymentDueDate": order.OrderDate.Add(24 * time.Hour),
			"createdAt":      order.OrderDate,
			"updatedAt":      now,
		})
	}
	mustInsert(ctx, collection, docs)
}

func insertSalesReport(ctx context.Context, collection *mongo.Collection, reportDate time.Time, orders []demoOrder, foodByID map[string]demoFood, now time.Time) {
	startOfDay := time.Date(reportDate.Year(), reportDate.Month(), reportDate.Day(), 0, 0, 0, 0, time.UTC)
	salesByFood := map[string]bson.M{}
	totalSales := 0.0
	totalOrders := 0

	for _, order := range orders {
		if order.OrderDate.Before(startOfDay) || !order.OrderDate.Before(startOfDay.Add(24*time.Hour)) || order.Status == "CANCELLED" {
			continue
		}

		totalOrders++
		for _, item := range order.Items {
			food := foodByID[item.FoodID]
			subtotal := food.Price * float64(item.Quantity)
			totalSales += subtotal

			if existing, ok := salesByFood[food.FoodID]; ok {
				existing["totalQuantity"] = existing["totalQuantity"].(int) + item.Quantity
				existing["totalSales"] = existing["totalSales"].(float64) + subtotal
			} else {
				salesByFood[food.FoodID] = bson.M{
					"foodId":        food.FoodID,
					"foodName":      food.Name,
					"totalQuantity": item.Quantity,
					"totalSales":    subtotal,
					"price":         food.Price,
				}
			}
		}
	}

	foodSales := make([]bson.M, 0, len(salesByFood))
	for _, item := range salesByFood {
		foodSales = append(foodSales, item)
	}

	mustInsert(ctx, collection, []interface{}{
		bson.M{
			"_id":         primitive.NewObjectID(),
			"reportDate":  startOfDay,
			"totalSales":  totalSales,
			"totalOrders": totalOrders,
			"foodSales":   foodSales,
			"createdAt":   now,
		},
	})
}

func mustInsert(ctx context.Context, collection *mongo.Collection, docs []interface{}) {
	if len(docs) == 0 {
		return
	}
	if _, err := collection.InsertMany(ctx, docs); err != nil {
		log.Fatalf("insert %s: %v", collection.Name(), err)
	}
}
