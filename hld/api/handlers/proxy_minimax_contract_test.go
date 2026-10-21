package handlers

import (
	"reflect"
	"testing"
)

func TestMiniMaxContract(t *testing.T) {
	for _, model := range []string{"", "MiniMax-M3.1-Flash", "MiniMax-M3", "MiniMax-M2.7", "saved-custom"} {
		t.Run(model, func(t *testing.T) {
			messages := []interface{}{map[string]interface{}{"role": "assistant", "content": []interface{}{map[string]interface{}{"type": "thinking", "thinking": "history", "signature": "signature"}}}}
			r := map[string]interface{}{"model": "claude", "thinking": map[string]interface{}{"type": "disabled"}, "service_tier": "priority", "output_config": map[string]interface{}{"effort": "none"}, "messages": messages}
			prepareMiniMaxRequest(r, model)
			wantModel := model
			if wantModel == "" {
				wantModel = "MiniMax-M3.1-Flash"
			}
			if r["model"] != wantModel {
				t.Errorf("model = %v", r["model"])
			}
			if !reflect.DeepEqual(r["messages"], messages) {
				t.Error("history changed")
			}
			if wantModel == "MiniMax-M3.1-Flash" {
				if r["thinking"].(map[string]interface{})["type"] != "adaptive" {
					t.Error("Flash thinking")
				}
				if _, ok := r["service_tier"]; ok {
					t.Error("Flash tier")
				}
				if _, ok := r["output_config"].(map[string]interface{})["effort"]; ok {
					t.Error("Flash effort none")
				}
			} else if r["thinking"].(map[string]interface{})["type"] != "disabled" || r["service_tier"] != "priority" {
				t.Error("explicit non-Flash settings changed")
			}
		})
	}
	for _, host := range []string{"api.minimax.io", "api.minimaxi.com"} {
		for _, path := range []string{"/anthropic", "/anthropic/", "/anthropic/v1", "/anthropic/v1/messages"} {
			if !isMiniMaxAnthropicURL("https://" + host + path) {
				t.Errorf("official endpoint rejected: %s%s", host, path)
			}
		}
	}
	for _, raw := range []string{"https://api.minimax.io.evil.test/anthropic", "https://api.minimax.io/anthropic?x=y", "https://api.minimax.io/anthropic#fragment", "https://user@api.minimax.io/anthropic", "http://api.minimax.io/anthropic", "https://openrouter.ai/api/v1"} {
		if isMiniMaxAnthropicURL(raw) {
			t.Errorf("unrelated endpoint matched: %s", raw)
		}
	}
	r := map[string]interface{}{"thinking": map[string]interface{}{"type": "enabled", "budget_tokens": 2048}}
	prepareMiniMaxRequest(r, "MiniMax-M3")
	if !reflect.DeepEqual(r["thinking"], map[string]interface{}{"type": "adaptive"}) {
		t.Error("M3 enabled thinking not normalized")
	}
}
