package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)


func jwtMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Get the Authorization header from the incoming request.
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// 2. The header should be in the format "Bearer <token>". Extract the token part.
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		jwtSecret := os.Getenv("JWT_SECRET")

		// 3. Parse and validate the token.
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Check the signing method to ensure it's the one we expect (HMAC).
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// 4. If the token is valid, extract the user's identity from the claims.
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// The 'sub' (subject) claim holds our user's email.
		userEmail, ok := claims["email"].(string)
		if !ok {
			http.Error(w, "Invalid subject in token claims", http.StatusUnauthorized)
			return
		}

		// 5. Add the user's email to the request's context so the next handler can access it.
		ctx := context.WithValue(r.Context(), UserEmailKey, userEmail)

		// 6. Call the next handler in the chain, passing the updated request with the new context.
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}