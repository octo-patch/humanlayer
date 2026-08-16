package handlers

import "strings"

// MiniMax provider constants used by the Anthropic proxy.
const (
	// MiniMaxAPIKeyEnvVar is the environment variable that holds the MiniMax API key.
	MiniMaxAPIKeyEnvVar = "MINIMAX_API_KEY"

	// MiniMaxDefaultBaseURL is the OpenAI-compatible base URL for the default region.
	MiniMaxDefaultBaseURL = "https://api.minimax.io/v1"

	// MiniMaxDefaultModel is used when a session does not set a model override.
	MiniMaxDefaultModel = "MiniMax-M3"
)

// miniMaxAPIHosts lists the regional OpenAI-compatible API hosts for MiniMax.
// The API is served from a different host per region, so both are recognised.
var miniMaxAPIHosts = []string{"api.minimax.io", "api.minimaxi.com"}

// isMiniMaxURL reports whether the given URL targets one of the MiniMax regional API hosts.
func isMiniMaxURL(url string) bool {
	for _, host := range miniMaxAPIHosts {
		if strings.Contains(url, host) {
			return true
		}
	}
	return false
}
