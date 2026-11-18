package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nwenisoe/menu-management/database"
)

func GetRouterHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "Router is healthy",
	})
}

func GetDatabaseHealth(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	dbClient := database.Client
	if dbClient == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "Database client uninitialized",
		})
		return
	}

	if err := dbClient.Ping(ctx, nil); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "Database unreachable",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "Database is healthy",
	})
}
