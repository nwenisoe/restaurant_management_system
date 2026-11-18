package controllers

import (
	"context"
	"net/http"
	"time"

	helper "github.com/nwenisoe/menu-management/helpers"
	"github.com/nwenisoe/menu-management/models"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var userCollection *mongo.Collection
var validate = validator.New()

func SignUp() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var user models.User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}

		if validationErr := validate.Struct(user); validationErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": validationErr.Error()})
			return
		}

		if len(*user.Password) > 72 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at most 72 bytes"})
			return
		}

		if exists, err := helper.CheckDuplicateFields(ctx, user.Email, user.Phone); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking user existence"})
			return
		} else if exists {
			c.JSON(http.StatusConflict, gin.H{"error": "User with this email or phone already exists"})
			return
		}

		passwordHash, err := helper.HashPassword(*user.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = &passwordHash
		user.ID = primitive.NewObjectID()
		user.UserID = user.ID.Hex()
		user.CreatedAt = time.Now().UTC()
		user.UpdatedAt = user.CreatedAt

		accessToken, refreshToken, err := helper.GenerateAllTokens(*user.Email, *user.FirstName, *user.LastName, user.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating tokens"})
			return
		}

		user.AccessToken = &accessToken
		user.RefreshToken = &refreshToken

		if _, err := userCollection.InsertOne(ctx, user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
			return
		}
		user.Password = nil
		user.RefreshToken = nil

		c.JSON(http.StatusOK, gin.H{"message": "User created successfully", "user": user})
	}
}

func Login() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var user models.User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}

		var foundUser models.User
		if user.Email == nil || user.Password == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
			return
		}
		if err := helper.FindUserByEmail(ctx, user.Email, &foundUser); err != nil || foundUser.Password == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		passwordIsValid, msg := helper.VerifyPassword(*foundUser.Password, *user.Password)
		if !passwordIsValid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": msg})
			return
		}

		accessToken, refreshToken, err := helper.GetOrGenerateTokens(foundUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating tokens"})
			return
		}

		if err := helper.UpdateAllTokens(accessToken, refreshToken, foundUser.UserID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating tokens"})
			return
		}

		foundUser.Password = nil
		foundUser.RefreshToken = nil
		foundUser.AccessToken = &accessToken

		c.JSON(http.StatusOK, gin.H{
			"message": "User logged in successfully",
			"user":    foundUser,
		})
	}
}

func GetUserByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		userId := c.Param("userId")
		if userId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
			return
		}

		var user models.User
		if err := helper.FindUserByID(ctx, userId, &user); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}

func GetAllUsers() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		recordPerPage, page := helper.GetPaginationParams(c)

		skip := (page - 1) * recordPerPage
		users, totalCount, err := helper.GetPaginatedUsers(ctx, skip, recordPerPage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve users"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"totalCount": totalCount,
			"userItems":  users,
		})
	}
}
