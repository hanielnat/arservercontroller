package agent

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"testing"
	"time"
)

const (
	testDir     = "/tmp/agent-service"
	testProfile = testDir + "/testProfile"
)

type mockProcessManager struct {
	startCalled bool
	killCalled  bool
	waitCalled  bool
	waitHook    func()
}

func (m *mockProcessManager) Start(cmd *exec.Cmd) error {
	m.startCalled = true
	cmd.Process = &os.Process{Pid: 1234}
	return nil
}

func (m *mockProcessManager) Kill(cmd *exec.Cmd) error {
	m.killCalled = true
	return nil
}

func (m *mockProcessManager) Wait(cmd *exec.Cmd) error {
	m.waitCalled = true
	if m.waitHook != nil {
		m.waitHook()
	}

	return nil
}

func TestReloadHandler(t *testing.T) {
	// inject mock
	oldPM := ProcManager
	ProcManager = &mockProcessManager{}
	defer func() { ProcManager = oldPM }()

	payload := ReloadPayload{
		ReforgerConfig: map[string]any{"game": map[string]any{"name": "Test Server"}},
		LaunchOptions:  []string{"-logLevel spam"},
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/reload", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	opts := &AgentOpts{
		ConfigPath: testDir,
		ProfileDir: testProfile,
		IsTesting:  true,
	}

	ReloadHandler(opts)(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}

	// check mock was used
	if !ProcManager.(*mockProcessManager).startCalled {
		t.Error("Start was not called on mock")
	}

	// call it again to test killing previous process
	req2 := httptest.NewRequest(http.MethodPost, "/reload", bytes.NewReader(body))
	rr2 := httptest.NewRecorder()
	ReloadHandler(opts)(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Errorf("expected 200 on second reload, got %d", rr2.Code)
	}

	if !ProcManager.(*mockProcessManager).waitCalled {
		t.Errorf("Wait was not called on the second ReloadHandler call")
	}
}

func TestReloadWaitBlocks(t *testing.T) {
	oldPM := ProcManager
	mock := &mockProcessManager{}
	ProcManager = mock
	defer func() { ProcManager = oldPM }()

	payload := ReloadPayload{
		ReforgerConfig: map[string]any{"game": map[string]any{"name": "Test Server"}},
	}
	body, _ := json.Marshal(payload)

	// first reload
	req := httptest.NewRequest(http.MethodPost, "/reload", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	ReloadHandler(&AgentOpts{ConfigPath: testDir, ProfileDir: testProfile})(rr, req)

	// mock hook to block wait
	waitCh := make(chan bool)
	mock.waitHook = func() {
		<-waitCh
	}

	// second reload in a goroutine
	done := make(chan bool)
	started := make(chan bool)

	go func() {
		req2 := httptest.NewRequest(http.MethodPost, "/reload", bytes.NewReader(body))
		rr2 := httptest.NewRecorder()

		log.Println("[test] calling second ReloadHandler")

		started <- true
		ReloadHandler(&AgentOpts{ConfigPath: testDir, ProfileDir: testProfile})(rr2, req2)
		done <- true
	}()
	<-started

	// wait a bit to ensure it reached the hook
	time.Sleep(50 * time.Millisecond)

	// status check in a goroutine
	statusDone := make(chan bool)
	go func() {
		reqS := httptest.NewRequest(http.MethodGet, "/status", nil)
		rrS := httptest.NewRecorder()
		StatusHandler(rrS, reqS)
		statusDone <- true
	}()

	// wait for status and second reload to be blocked
	select {
	case <-done:
		t.Fatal("Second reload should be blocked by Wait")
	case <-statusDone:
		t.Fatal("StatusHandler should be blocked while Reload is waiting")
	case <-time.After(100 * time.Millisecond):
		// good, they are blocked
	}

	// release wait
	waitCh <- true

	// they should now finish
	select {
	case <-done:
		// good
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Second reload failed to finish after releasing Wait")
	}

	select {
	case <-statusDone:
		// good
	case <-time.After(500 * time.Millisecond):
		t.Fatal("StatusHandler failed to finish after releasing Wait")
	}
}

func TestStatusHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/status", nil)
	rr := httptest.NewRecorder()

	StatusHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}
