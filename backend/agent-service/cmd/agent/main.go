package main

import (
	"log"
	"net/http"
	"os"

	agent "github.com/hanielnat/arservercontroller/agent-service/internal"
)

const AgentPortKey = "AGENT_PORT"

func main() {
	opts := &agent.AgentOpts{
		ConfigPath: agent.ConfigPath,
		ProfileDir: agent.ProfileDir,
		IsTesting:  false,
	}

	http.HandleFunc("/reload", agent.ReloadHandler(opts))
	http.HandleFunc("/status", agent.StatusHandler)

	port := ":8080"
	envValue, ok := os.LookupEnv(AgentPortKey)
	if ok {
		port = ":" + envValue
	}

	log.Printf("[agent] arserver-agent starting on %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
