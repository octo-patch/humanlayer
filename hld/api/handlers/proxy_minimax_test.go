package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/humanlayer/humanlayer/hld/store"
)

type miniMaxTestStore struct {
	store.ConversationStore
	session *store.Session
}

func (s miniMaxTestStore) GetSession(context.Context, string) (*store.Session, error) {
	return s.session, nil
}

type miniMaxTestTransport func(*http.Request) (*http.Response, error)

func (f miniMaxTestTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func TestMiniMaxProxyHTTPBoundary(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, host := range []string{"api.minimax.io", "api.minimaxi.com"} {
		for _, model := range []string{"", "MiniMax-M3.1-Flash", "MiniMax-M3", "MiniMax-M2.7", "custom-model"} {
			for _, stream := range []bool{false, true} {
				t.Run(host+"/"+model+"/"+map[bool]string{false: "json", true: "stream"}[stream], func(t *testing.T) {
					t.Setenv("MINIMAX_API_KEY", "fixture-env-key")
					input := `{"model":"original-model","max_tokens":4096,"service_tier":"priority","thinking":{"type":"disabled"},"output_config":{"effort":"none"},"tools":[{"name":"read","input_schema":{"type":"object"}}],"messages":[{"role":"assistant","content":[{"type":"thinking","thinking":"history","signature":"signature"},{"type":"tool_use","id":"call","name":"read","input":{}}]},{"role":"user","content":[{"type":"tool_result","tool_use_id":"call","content":"result"},{"type":"image","source":{"type":"url","url":"https://example.com/image.png"}},{"type":"text","text":"continue"}]}]}`
					var original map[string]interface{}
					if err := json.Unmarshal([]byte(input), &original); err != nil {
						t.Fatal(err)
					}
					original["stream"] = stream
					body, _ := json.Marshal(original)
					s := &store.Session{ID: "fixture", ProxyEnabled: true, ProxyBaseURL: "https://" + host + "/anthropic", ProxyModelOverride: model, ProxyAPIKey: "fixture-session-key"}
					h := NewProxyHandler(nil, miniMaxTestStore{session: s})
					called := false
					h.httpClient = &http.Client{Transport: miniMaxTestTransport(func(req *http.Request) (*http.Response, error) {
						called = true
						if req.URL.String() != "https://"+host+"/anthropic/v1/messages" {
							t.Errorf("unexpected URL: %s", req.URL)
						}
						if req.Header.Get("Authorization") != "Bearer fixture-session-key" {
							t.Error("session key not used")
						}
						if req.Header.Get("anthropic-version") != "2023-06-01" {
							t.Error("version missing")
						}
						var got map[string]interface{}
						if err := json.NewDecoder(req.Body).Decode(&got); err != nil {
							t.Fatal(err)
						}
						wantModel := model
						if wantModel == "" {
							wantModel = "MiniMax-M3.1-Flash"
						}
						if got["model"] != wantModel {
							t.Errorf("model = %v", got["model"])
						}
						for _, key := range []string{"messages", "tools", "max_tokens", "stream"} {
							if !reflect.DeepEqual(got[key], original[key]) {
								t.Errorf("%s changed", key)
							}
						}
						if wantModel == "MiniMax-M3.1-Flash" {
							if got["thinking"].(map[string]interface{})["type"] != "adaptive" {
								t.Error("Flash must think adaptively")
							}
							if _, ok := got["service_tier"]; ok {
								t.Error("Flash tier retained")
							}
							if _, ok := got["output_config"].(map[string]interface{})["effort"]; ok {
								t.Error("unsupported effort retained")
							}
						} else {
							for _, key := range []string{"thinking", "service_tier", "output_config"} {
								if !reflect.DeepEqual(got[key], original[key]) {
									t.Errorf("explicit %s changed", key)
								}
							}
						}
						response := `{"type":"message","content":[{"type":"thinking","thinking":"retained"}]}`
						if stream {
							response = "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n"
						}
						return &http.Response{StatusCode: 200, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(response))}, nil
					})}
					router := gin.New()
					router.POST("/proxy/:session_id/v1/messages", h.ProxyAnthropicRequest)
					req := httptest.NewRequest("POST", "/proxy/fixture/v1/messages", strings.NewReader(string(body)))
					req.Header.Set("anthropic-version", "2023-06-01")
					w := httptest.NewRecorder()
					router.ServeHTTP(w, req)
					if !called || w.Code != 200 {
						t.Fatalf("transport called=%v, status=%d", called, w.Code)
					}
					if stream && !strings.Contains(w.Body.String(), "event: message_stop") {
						t.Error("SSE changed")
					}
					if !stream && !strings.Contains(w.Body.String(), `"thinking":"retained"`) {
						t.Error("response history changed")
					}
				})
			}
		}
	}
}

func TestMiniMaxURLRecognition(t *testing.T) {
	for _, raw := range []string{"https://api.minimax.io.evil.test/anthropic", "http://api.minimax.io/anthropic", "https://openrouter.ai/api/v1", "https://api.minimax.io/v1"} {
		if isMiniMaxAnthropicURL(raw) {
			t.Errorf("unexpected MiniMax URL: %s", raw)
		}
	}
}

func TestMiniMaxSupportedEffort(t *testing.T) {
	for _, effort := range []string{"low", "medium", "high", "xhigh", "max"} {
		r := map[string]interface{}{"output_config": map[string]interface{}{"effort": effort}}
		prepareMiniMaxRequest(r, "MiniMax-M3.1-Flash")
		if r["output_config"].(map[string]interface{})["effort"] != effort {
			t.Errorf("effort %s changed", effort)
		}
	}
}
