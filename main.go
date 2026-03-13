package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/nwenisoe/menu-management/config"
	"github.com/nwenisoe/menu-management/middlewares"
	"github.com/nwenisoe/menu-management/routes"
	"github.com/nwenisoe/menu-management/utils"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env files
	err := godotenv.Load(".envs/.mongo.env")
	if err != nil {
		fmt.Printf("Warning: Could not load .envs/.mongo.env file: %v\n", err)
	}
	
	err = godotenv.Load(".envs/.server.env")
	if err != nil {
		fmt.Printf("Warning: Could not load .envs/.server.env file: %v\n", err)
	}

	err = utils.InitializeLogger(zapcore.DebugLevel, []string{"stdout"})
	if err != nil {
		fmt.Printf("Error initializing logger: %v\n", err)
		os.Exit(1)
	}
	log := utils.GetLogger()

	port := config.GetEnvAsInt("PORT", 8080)
	ginMode := config.GetEnv("GIN_MODE", "release")

	gin.SetMode(ginMode)
	router := gin.New()

	router.Use(middlewares.ZapLoggerMiddleware(log))
	router.Use(gin.Recovery())
	// Allow requests from frontend dev server (Vite) and other origins as needed
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.HealthRoutes(router)
	routes.UserRoutes(router)

	router.Use(middlewares.Authentication())

	routes.MenuRoutes(router)
	routes.FoodRoutes(router)
	routes.TableRoutes(router)
	routes.OrderRoutes(router)
	routes.OrderItemRoutes(router)
	routes.InvoiceRoutes(router)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: router,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start", zap.Error(err))
		}
	}()
	log.Info(fmt.Sprintf("Server is running on port %d", port))

	<-quit
	log.Info("Shutdown signal received, exiting gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Server exited cleanly")
}
