package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/humanlayer/humanlayer/hld/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfigStatusIncludesMiniMax(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-value")
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.GET("/config/status", NewConfigHandler().GetConfigStatus)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/config/status", nil)
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]map[string]bool
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &response))
	assert.True(t, response["minimax"]["api_key_configured"])
}

func TestMiniMaxAuthHeaders(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-value")
	gin.SetMode(gin.TestMode)

	for _, targetURL := range []string{
		"https://api.minimax.io/v1/chat/completions",
		"https://api.minimaxi.com/v1/chat/completions",
	} {
		t.Run(targetURL, func(t *testing.T) {
			context, _ := gin.CreateTestContext(httptest.NewRecorder())
			request := httptest.NewRequest(http.MethodPost, targetURL, nil)
			session := &store.Session{ID: "test-session"}

			err := (&ProxyHandler{}).setAuthHeaders(context, request, targetURL, session)

			require.NoError(t, err)
			assert.Equal(t, "Bearer test-value", request.Header.Get("Authorization"))
		})
	}
}
