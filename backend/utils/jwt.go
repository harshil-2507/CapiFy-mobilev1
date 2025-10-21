package utils

import (
	"errors"
	"finance-app-backend/models"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(getJWTSecret())

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Default secret for development - change this in production!
		secret = "capify-finance-app-super-secret-key-2024"
	}
	return secret
}

type Claims struct {
	UserID       uint   `json:"user_id"`
	MobileNumber string `json:"mobile_number"`
	jwt.RegisteredClaims
}

// GenerateAccessToken generates a JWT access token
func GenerateAccessToken(user *models.User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // 24 hours

	claims := &Claims{
		UserID:       user.ID,
		MobileNumber: user.MobileNumber,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "capify-auth",
			Subject:   strconv.Itoa(int(user.ID)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// GenerateRefreshToken generates a JWT refresh token
func GenerateRefreshToken(user *models.User) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days

	claims := &Claims{
		UserID:       user.ID,
		MobileNumber: user.MobileNumber,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "capify-refresh",
			Subject:   strconv.Itoa(int(user.ID)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// GenerateTokenPair generates both access and refresh tokens
func GenerateTokenPair(user *models.User) (accessToken, refreshToken string, err error) {
	accessToken, err = GenerateAccessToken(user)
	if err != nil {
		return "", "", err
	}

	refreshToken, err = GenerateRefreshToken(user)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
