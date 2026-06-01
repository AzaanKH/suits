package main

import (
	"context"
	"flag"
	"log"
	"os"

	"github.com/AzaanKH/suits.com/db"
	"github.com/gofiber/fiber"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Printf("Warning: .env file not found or cannot be loaded: %v", err)
	}
	flag.Parse()
}

func main() {
	DBURI := os.Getenv("MONGO_DB_URI")
	client, err := mongo.Connect(context.TODO(), options.Client().
		ApplyURI(DBURI))
	if err != nil {
		log.Fatal(err)
	}
	// app := fiber.New()
	_ = fiber.New()
	_ = db.NewMongoUserStore(client)
}
