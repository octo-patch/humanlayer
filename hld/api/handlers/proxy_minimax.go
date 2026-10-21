package handlers

import (
	"net/url"
	"strings"
)

// Only the official MiniMax Anthropic endpoints use native message passthrough.
func isMiniMaxAnthropicURL(rawURL string) bool {
	u, err := url.Parse(rawURL)
	if err != nil || u.Scheme != "https" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		return false
	}
	if u.Host != "api.minimax.io" && u.Host != "api.minimaxi.com" {
		return false
	}
	switch strings.TrimRight(u.Path, "/") {
	case "/anthropic", "/anthropic/v1", "/anthropic/v1/messages":
		return true
	default:
		return false
	}
}

func prepareMiniMaxRequest(request map[string]interface{}, model string) {
	if model == "" {
		model = "MiniMax-M3.1-Flash"
	}
	request["model"] = model
	// Keep saved/custom models and their explicit options intact. Flash always
	// thinks, while M3 also supports disabled thinking.
	if model == "MiniMax-M3.1-Flash" {
		request["thinking"] = map[string]interface{}{"type": "adaptive"}
		delete(request, "service_tier")
		if output, ok := request["output_config"].(map[string]interface{}); ok {
			if output["effort"] == "none" {
				delete(output, "effort")
			}
		}
	} else if model == "MiniMax-M3" {
		if thinking, ok := request["thinking"].(map[string]interface{}); ok && thinking["type"] == "enabled" {
			request["thinking"] = map[string]interface{}{"type": "adaptive"}
		}
	}
}
