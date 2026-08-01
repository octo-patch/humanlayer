package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/humanlayer/humanlayer/hld/store"
	"github.com/stretchr/testify/require"
)

func TestGetConfigStatusMiniMax(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("MINIMAX_API_KEY", "environment-key")

	handler := NewConfigHandler()
	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)

	handler.GetConfigStatus(context)

	var status map[string]map[string]bool
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &status))
	require.True(t, status["minimax"]["api_key_configured"])
}

func TestSetAuthHeadersMiniMax(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("uses the session bearer key", func(t *testing.T) {
		handler := &ProxyHandler{}
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		request := httptest.NewRequest(http.MethodPost, "https://api.minimax.io/v1/chat/completions", nil)
		session := &store.Session{ID: "test-session", ProxyAPIKey: "session-key"}

		err := handler.setAuthHeaders(context, request, request.URL.String(), session)

		require.NoError(t, err)
		require.Equal(t, "Bearer session-key", request.Header.Get("Authorization"))
	})

	t.Run("uses the configured environment bearer key", func(t *testing.T) {
		t.Setenv("MINIMAX_API_KEY", "environment-key")

		handler := &ProxyHandler{}
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		request := httptest.NewRequest(http.MethodPost, "https://api.minimaxi.com/v1/chat/completions", nil)
		session := &store.Session{ID: "test-session"}

		err := handler.setAuthHeaders(context, request, request.URL.String(), session)

		require.NoError(t, err)
		require.Equal(t, "Bearer environment-key", request.Header.Get("Authorization"))
	})
}
