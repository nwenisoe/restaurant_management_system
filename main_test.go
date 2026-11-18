package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/nwenisoe/menu-management/helpers"
	"go.uber.org/zap"
)

func TestRouteAuthentication(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-only-signing-key")
	if err := helpers.InitializeJWT(); err != nil {
		t.Fatal(err)
	}
	access, refresh, err := helpers.GenerateAllTokens("test@example.com", "Test", "User", "user-id")
	if err != nil {
		t.Fatal(err)
	}
	router := newRouter(zap.NewNop())
	for _, tt := range []struct {
		method, path, token, body string
		status                    int
	}{
		{http.MethodGet, "/health/router", "", "", http.StatusOK},
		{http.MethodGet, "/api/v1/users/", "", "", http.StatusUnauthorized},
		{http.MethodGet, "/api/v1/users/user-id", "", "", http.StatusUnauthorized},
		{http.MethodGet, "/api/v1/invoices", "", "", http.StatusUnauthorized},
		{http.MethodDelete, "/api/v1/invoices/invoice-id", "", "", http.StatusUnauthorized},
		{http.MethodPost, "/api/v1/orders/order-id/invoice", refresh, "{", http.StatusUnauthorized},
		{http.MethodPost, "/api/v1/orders/order-id/invoice", access, "{", http.StatusBadRequest},
		{http.MethodPost, "/api/v1/orderItems", access, `{"tableId":"table-id","orderItems":[]}`, http.StatusBadRequest},
		{http.MethodPost, "/api/v1/users/login", "", "{}", http.StatusBadRequest},
		{http.MethodPost, "/api/v1/users/signup", "", "{}", http.StatusBadRequest},
		{http.MethodPost, "/api/v1/users/signup", "", `{"email":"test@example.com","firstName":"Test","lastName":"User","phone":"123456","password":"` + strings.Repeat("x", 73) + `"}`, http.StatusBadRequest},
	} {
		t.Run(tt.method+" "+tt.path, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			if tt.token != "" {
				req.Header.Set("Authorization", "Bearer "+tt.token)
			}
			res := httptest.NewRecorder()
			router.ServeHTTP(res, req)
			if res.Code != tt.status {
				t.Fatalf("status = %d, want %d: %s", res.Code, tt.status, res.Body)
			}
		})
	}
}
