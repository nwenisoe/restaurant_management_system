package helpers

import (
	"context"

	"github.com/nwenisoe/menu-management/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CheckDuplicateFields(ctx context.Context, email *string, phone *string) (bool, error) {
	if email != nil && *email != "" {
		filter := bson.M{"email": *email}
		count, err := userCollection.CountDocuments(ctx, filter)
		if err != nil {
			return false, err
		}
		if count > 0 {
			return true, nil
		}
	}

	if phone != nil && *phone != "" {
		filter := bson.M{"phone": *phone}
		count, err := userCollection.CountDocuments(ctx, filter)
		if err != nil {
			return false, err
		}
		if count > 0 {
			return true, nil
		}
	}

	return false, nil
}

func FindUserByEmail(ctx context.Context, email *string, user *models.User) error {
	return userCollection.FindOne(ctx, bson.M{"email": email}).Decode(user)
}

func FindUserByID(ctx context.Context, userId string, user *models.User) error {
	projection := bson.D{
		{Key: "password", Value: 0},
		{Key: "accessToken", Value: 0},
		{Key: "refreshToken", Value: 0},
	}
	return userCollection.FindOne(ctx, bson.M{"userId": userId}, &options.FindOneOptions{Projection: projection}).Decode(user)
}

func GetPaginatedUsers(ctx context.Context, skip int64, recordPerPage int64) ([]models.User, int64, error) {
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.D{}}},
		bson.D{{Key: "$skip", Value: skip}},
		bson.D{{Key: "$limit", Value: recordPerPage}},
		bson.D{{Key: "$project", Value: bson.D{
			{Key: "password", Value: 0},
			{Key: "accessToken", Value: 0},
			{Key: "refreshToken", Value: 0},
		}}},
	}

	cursor, err := userCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, 0, err
	}

	totalCount, err := userCollection.CountDocuments(ctx, bson.D{})
	if err != nil {
		return nil, 0, err
	}

	return users, totalCount, nil
}
