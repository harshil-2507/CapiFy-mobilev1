package main

import (
    "finance-app-backend/config"
    "finance-app-backend/routes"
    "github.com/gin-gonic/gin"
)

func main() {
    config.ConnectDatabase()
    r := gin.Default()

    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Welcome to CapiFy Backend!"})
    })

    routes.RegisterExpenseRoutes(r)

    r.Run(":8080")
}
