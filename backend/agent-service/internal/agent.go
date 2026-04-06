package agent

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

const (
	ConfigPath = "/home/reforger/config.json"
	ProfileDir = "/home/reforger"
)

var (
	gameCmd    *exec.Cmd
	gameMutex  sync.RWMutex
	lastLaunch []string
)

var ProcManager ProcessManager = realProcessManager{}

func (realProcessManager) Start(cmd *exec.Cmd) error {
	return cmd.Start()
}

func (realProcessManager) Kill(cmd *exec.Cmd) error {
	if cmd != nil && cmd.Process != nil {
		return cmd.Process.Kill()
	}

	return nil
}

func (realProcessManager) Wait(cmd *exec.Cmd) error {
	if cmd != nil {
		return cmd.Wait()
	}

	return nil
}

func WriteConfig(cfg map[string]any, configPath ...string) error {
	overwrite := ""
	if len(configPath) > 0 && configPath[0] != "" {
		overwrite = configPath[0]
	}

	if overwrite != "" {
		if err := os.MkdirAll(filepath.Dir(overwrite), 0755); err != nil {
			log.Printf("[agent] Error calling 'mkdir' on defined config path, error: %s", err.Error())
			return err
		}

		log.Printf("[agent] Directories for extra config path created: '%s'", overwrite)
		return doWriteConfig(cfg, overwrite)
	}

	log.Printf("[agent] Writing config on the default path: '%s'", ConfigPath)
	return doWriteConfig(cfg, ConfigPath)
}

func doWriteConfig(cfg map[string]any, configPath string) error {
	data, err := json.MarshalIndent(cfg, "", "    ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}

func startGame(launchOpts []string) error {
	gameMutex.Lock()
	defer gameMutex.Unlock()

	// kill old process
	if gameCmd != nil && gameCmd.Process != nil {
		ProcManager.Kill(gameCmd)

		if err := ProcManager.Wait(gameCmd); err != nil {
			log.Printf("[agent] Error waiting for game server: %s", err.Error())
		}
	}

	cmd := exec.Command(os.Getenv("REFORGER"), launchOpts...)
	cmd.Dir = ProfileDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := ProcManager.Start(cmd); err != nil {
		return err
	}

	gameCmd = cmd
	lastLaunch = launchOpts
	pid := 0

	if cmd.Process != nil {
		pid = cmd.Process.Pid
	}

	log.Printf("[agent] Game server started (PID %d)", pid)
	return nil
}

func reloadGame(writer http.ResponseWriter, r *http.Request, opts *AgentOpts) {
	var p ReloadPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	configFile := filepath.Join(opts.ConfigPath, "config.json")
	if err := WriteConfig(p.ReforgerConfig, configFile); err != nil {
		http.Error(writer, err.Error(), http.StatusInternalServerError)
		return
	}

	launch := []string{"-profile", opts.ProfileDir, "-config", configFile}
	launch = append(launch, p.LaunchOptions...)

	if err := startGame(launch); err != nil {
		http.Error(writer, err.Error(), http.StatusInternalServerError)
		return
	}

	pid := 0
	if gameCmd != nil && gameCmd.Process != nil {
		pid = gameCmd.Process.Pid
	}

	writer.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(writer, `{"status":"reloaded","pid":%d}`, pid)
}

func ReloadHandler(opts *AgentOpts) http.HandlerFunc {
	return func(writer http.ResponseWriter, r *http.Request) {
		reloadGame(writer, r, opts)
	}
}

func StatusHandler(writer http.ResponseWriter, request *http.Request) {
	gameMutex.RLock()
	pid := 0
	if gameCmd != nil && gameCmd.Process != nil {
		pid = gameCmd.Process.Pid
	}
	gameMutex.RUnlock()

	resp := map[string]any{
		"game_pid":  pid,
		"config_ok": true,
	}
	writer.Header().Set("Content-Type", "application/json")
	json.NewEncoder(writer).Encode(resp)
}
