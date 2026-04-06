package agent

import "os/exec"

type ReloadPayload struct {
	ReforgerConfig map[string]any `json:"reforgerConfig"`
	LaunchOptions  []string       `json:"launchOptions,omitempty"`
}

type AgentOpts struct {
	ProfileDir string
	ConfigPath string
	IsTesting  bool
}

type ProcessManager interface {
	Start(cmd *exec.Cmd) error
	Kill(cmd *exec.Cmd) error
	Wait(cmd *exec.Cmd) error
}

type realProcessManager struct{}
