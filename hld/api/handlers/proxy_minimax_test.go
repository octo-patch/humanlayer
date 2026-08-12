package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/humanlayer/humanlayer/hld/store"
)

func TestSetAuthHeadersUsesMiniMaxEnvironmentKey(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "configured")
	gin.SetMode(gin.TestMode)

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(http.MethodPost, "https://api.minimax.io/v1/chat/completions", nil)

	handler := &ProxyHandler{}
	currentSession := &store.Session{ID: "session-1", ProxyEnabled: true}
	if err := handler.setAuthHeaders(context, request, request.URL.String(), currentSession); err != nil {
		t.Fatalf("set headers: %v", err)
	}
	if got := request.Header.Get("Authorization"); got != "Bearer configured" {
		t.Fatalf("expected MiniMax authorization header, got %q", got)
	}
}
