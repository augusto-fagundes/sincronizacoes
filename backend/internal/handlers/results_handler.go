package handlers

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Result represents a sync job status and optional payload
type Result struct {
	Status     string      `json:"status"`
	Payload    interface{} `json:"payload,omitempty"`
	StartedAt  time.Time   `json:"startedAt,omitempty"`
	ReceivedAt time.Time   `json:"receivedAt,omitempty"`
}

var syncStore = struct {
	mu sync.RWMutex
	m  map[string]Result
}{m: make(map[string]Result)}

// markPending records a job as pending
func markPending(jobID string, payload interface{}) {
	syncStore.mu.Lock()
	defer syncStore.mu.Unlock()
	syncStore.m[jobID] = Result{Status: "pending", Payload: payload, StartedAt: time.Now()}
}

// setResult records a final job result
func setResult(jobID string, status string, payload interface{}) {
	syncStore.mu.Lock()
	defer syncStore.mu.Unlock()
	syncStore.m[jobID] = Result{Status: status, Payload: payload, ReceivedAt: time.Now()}
}

// GetSyncResult returns the status/payload for a given jobId
func GetSyncResult(c *gin.Context) {
	jobID := c.Param("jobId")
	syncStore.mu.RLock()
	res, ok := syncStore.m[jobID]
	syncStore.mu.RUnlock()
	if !ok {
		c.JSON(http.StatusOK, gin.H{"status": "pending"})
		return
	}
	c.JSON(http.StatusOK, res)
}

// PostSyncResult is called by n8n to notify completion
func PostSyncResult(c *gin.Context) {
	var body struct {
		JobID   string      `json:"jobId"`
		Status  string      `json:"status"`
		Payload interface{} `json:"payload"`
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}
	if body.JobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "jobId obrigatório"})
		return
	}
	if body.Status == "" {
		body.Status = "success"
	}
	setResult(body.JobID, body.Status, body.Payload)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}