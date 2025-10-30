package models

import "time"

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Client struct {
	Codigo string `json:"codigo"`
	Nome   string `json:"nome"`
	Plano  string `json:"plano"`
}

type Payload struct {
	JobID       string      `json:"jobId"`
	BatchID     string      `json:"batchID"`
	Domain      string      `json:"domain"`
	Credentials Credentials `json:"credentials"`
	Platform    string      `json:"platform"`
	Action      string      `json:"action"`
	Clients     []Client    `json:"clients"`
	TotalClients int        `json:"totalClients"`
	Timestamp   time.Time   `json:"timestamp"`
}