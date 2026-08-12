package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetConfigStatusIncludesMiniMax(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "configured")
	gin.SetMode(gin.TestMode)

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/config/status", nil)

	NewConfigHandler().GetConfigStatus(context)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}

	var response map[string]map[string]bool
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !response["minimax"]["api_key_configured"] {
		t.Fatal("expected MiniMax API key to be reported as configured")
	}
}
