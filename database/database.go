package database

import (
	"context"
	"time"

	"github.com/nwenisoe/menu-management/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var db *mongo.Database

func Connect(ctx context.Context) error {
	uri := config.GetEnv("MONGODB_URI", "mongodb://root:example@localhost:27017/restaurant?authSource=admin")
	timeout := config.GetEnvAsInt("MONGODB_CONNECT_TIMEOUT", 10)
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}
	if err := client.Ping(ctx, nil); err != nil {
		cleanup, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = client.Disconnect(cleanup)
		return err
	}
	Client = client
	db = client.Database(config.GetEnv("MONGODB_DATABASE", "restaurant"))
	return nil
}

func OpenCollection(name string) *mongo.Collection {
	return db.Collection(name)
}
