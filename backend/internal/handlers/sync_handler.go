package handlers

import (
	"ativacao-em-massa/backend/internal/models"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getWebhookURL(platform string) (string, error) {
	switch platform {
	case "Watch TV":
		return os.Getenv("N8N_WEBHOOK_URL_WATCHTV"), nil
	case "Playhub":
		return os.Getenv("N8N_WEBHOOK_URL_PLAYHUB"), nil
	case "Campsoft":
		return os.Getenv("N8N_WEBHOOK_URL_CAMPSOFT"), nil
	default:
		return "", fmt.Errorf("plataforma '%s' não é suportada", platform)
	}
}

func SyncHandler(c *gin.Context) {
	var payload models.Payload
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	// usa jobId do front ou gera um novo
	if payload.JobID == "" {
		payload.JobID = uuid.New().String()
	}
	// compatibilidade: manter BatchID igual ao JobID
	payload.BatchID = payload.JobID

	webhookURL, err := getWebhookURL(payload.Platform)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if webhookURL == "" {
		log.Printf("ERRO: Webhook URL para a plataforma '%s' não está configurada no ambiente.", payload.Platform)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Configuração interna do servidor incompleta."})
		return
	}


	// marca como pendente no store do backend
	markPending(payload.JobID, map[string]any{"startedBy": payload.Credentials.Username, "total": payload.TotalClients})

	n8nPayload, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao preparar dados para o webhook."})
		return
	}

	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(n8nPayload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao enviar para o webhook: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("Webhook retornou status de erro: %d", resp.StatusCode)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "O serviço de automação retornou um erro."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Lote recebido. Processando em segundo plano.", "jobId": payload.JobID})
}