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
	Name     string
	Category string
}

type demoFood struct {
	Name     string
	Price    float64
	Image    string
	MenuName string
}

type demoTable struct {
	Number int
	Seats  int
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
	now := time.Now().UTC()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 3, 0)

	menus := []demoMenu{
		{Name: "Sunrise Breakfast", Category: "Breakfast"},
		{Name: "Market Lunch", Category: "Lunch"},
		{Name: "Evening Dinner", Category: "Dinner"},
		{Name: "Coffee & Drinks", Category: "Drinks"},
		{Name: "Dessert Bar", Category: "Dessert"},
	}

	menuIDs := map[string]string{}
	for _, item := range menus {
		menuID, err := upsertMenu(ctx, db.Collection("menu"), item, startDate, endDate, now)
		if err != nil {
			log.Fatalf("seed menu %q: %v", item.Name, err)
		}
		menuIDs[item.Name] = menuID
	}

	foods := []demoFood{
		{
			Name:     "Avocado Toast",
			Price:    8.50,
			Image:    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
			MenuName: "Sunrise Breakfast",
		},
		{
			Name:     "Berry Pancakes",
			Price:    9.25,
			Image:    "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80",
			MenuName: "Sunrise Breakfast",
		},
		{
			Name:     "Grilled Chicken Bowl",
			Price:    12.75,
			Image:    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
			MenuName: "Market Lunch",
		},
		{
			Name:     "Crispy Salmon",
			Price:    18.90,
			Image:    "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=900&q=80",
			MenuName: "Evening Dinner",
		},
		{
			Name:     "Iced Latte",
			Price:    4.75,
			Image:    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
			MenuName: "Coffee & Drinks",
		},
		{
			Name:     "Chocolate Tart",
			Price:    6.95,
			Image:    "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
			MenuName: "Dessert Bar",
		},
	}

	for _, item := range foods {
		menuID := menuIDs[item.MenuName]
		if menuID == "" {
			log.Fatalf("missing menu ID for %q", item.MenuName)
		}
		if err := upsertFood(ctx, db.Collection("food"), item, menuID, now); err != nil {
			log.Fatalf("seed food %q: %v", item.Name, err)
		}
	}

	tables := []demoTable{
		{Number: 1, Seats: 2},
		{Number: 2, Seats: 4},
		{Number: 3, Seats: 4},
		{Number: 4, Seats: 6},
		{Number: 5, Seats: 8},
		{Number: 6, Seats: 2},
	}

	for _, item := range tables {
		if err := upsertTable(ctx, db.Collection("table"), item, now); err != nil {
			log.Fatalf("seed table %d: %v", item.Number, err)
		}
	}

	fmt.Println("Demo data seeded: 5 menus, 6 foods, 6 tables")
}

func upsertMenu(ctx context.Context, collection *mongo.Collection, item demoMenu, startDate, endDate, now time.Time) (string, error) {
	var existing struct {
		MenuID string `bson:"menuId"`
	}

	err := collection.FindOne(ctx, bson.M{"name": item.Name}).Decode(&existing)
	if err == nil && existing.MenuID != "" {
		_, err = collection.UpdateOne(ctx, bson.M{"name": item.Name}, bson.M{
			"$set": bson.M{
				"category":  item.Category,
				"startDate": startDate,
				"endDate":   endDate,
				"updatedAt": now,
			},
		})
		return existing.MenuID, err
	}
	if err != nil && err != mongo.ErrNoDocuments {
		return "", err
	}

	id := primitive.NewObjectID()
	menuID := id.Hex()
	_, err = collection.InsertOne(ctx, bson.M{
		"_id":       id,
		"menuId":    menuID,
		"name":      item.Name,
		"category":  item.Category,
		"startDate": startDate,
		"endDate":   endDate,
		"createdAt": now,
		"updatedAt": now,
	})
	return menuID, err
}

func upsertFood(ctx context.Context, collection *mongo.Collection, item demoFood, menuID string, now time.Time) error {
	update := bson.M{
		"$set": bson.M{
			"name":      item.Name,
			"price":     item.Price,
			"foodImage": item.Image,
			"menuId":    menuID,
			"updatedAt": now,
		},
		"$setOnInsert": bson.M{
			"_id":       primitive.NewObjectID(),
			"foodId":    primitive.NewObjectID().Hex(),
			"createdAt": now,
		},
	}

	_, err := collection.UpdateOne(ctx, bson.M{"name": item.Name}, update, options.Update().SetUpsert(true))
	return err
}

func upsertTable(ctx context.Context, collection *mongo.Collection, item demoTable, now time.Time) error {
	update := bson.M{
		"$set": bson.M{
			"tableNumber":    item.Number,
			"numberOfGuests": item.Seats,
			"updatedAt":      now,
		},
		"$setOnInsert": bson.M{
			"_id":       primitive.NewObjectID(),
			"tableId":   primitive.NewObjectID().Hex(),
			"createdAt": now,
		},
	}

	_, err := collection.UpdateOne(ctx, bson.M{"tableNumber": item.Number}, update, options.Update().SetUpsert(true))
	return err
}
