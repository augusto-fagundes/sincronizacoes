"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  Eye,
  ArrowLeft,
  Trash2,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

interface FormData {
  domain: string;
  username: string;
  password: string;
  platform: string;
  file: File | null;
  action: string;
}

interface ClientData {
  codigo: string;
  nome: string;
  plano: string;
}

export function ClientSyncForm({
  onOpenResults,
  onSyncStarted,
}: {
  onOpenResults?: (jobId: string) => void;
  onSyncStarted?: (jobId: string) => void;
}) {
  const [formData, setFormData] = useState<FormData>({
    domain: "",
    username: "",
    password: "",
    platform: "",
    file: null,
    action: "",
  });

  const handleRemoveFile = () => {
    setFormData({ ...formData, file: null });

    setClientsData([]);

    setParseError("");

    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [clientsData, setClientsData] = useState<ClientData[]>([]);
  const [parseError, setParseError] = useState("");
  const [newClient, setNewClient] = useState<ClientData>({
    codigo: "",
    nome: "",
    plano: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [jobId] = useState<string>(() => crypto.randomUUID());

  const parseSpreadsheet = async (file: File): Promise<ClientData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event.target?.result;

          // Ler o arquivo usando xlsx
          const workbook = XLSX.read(data, { type: "binary" });

          // Pegar a primeira planilha
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Converter para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as string[][];

          if (jsonData.length < 2) {
            throw new Error("Planilha vazia ou sem dados");
          }

          // Processar as linhas (pular cabeçalho)
          const clients: ClientData[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Verificar se a linha tem dados válidos
            if (row && row.length >= 3 && row[0]) {
              clients.push({
                codigo: String(row[0]).trim(),
                nome: String(row[1] || "").trim(),
                plano: String(row[2] || "").trim(),
              });
            }
          }

          if (clients.length === 0) {
            throw new Error("Nenhum cliente válido encontrado na planilha");
          }

          resolve(clients);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
    setParseError("");

    if (file) {
      try {
        const clients = await parseSpreadsheet(file);
        setClientsData(clients);
      } catch (error) {
        setParseError(
          error instanceof Error ? error.message : "Erro ao processar planilha"
        );
        console.error("[v0] Erro ao processar planilha:", error);
      }
    }
  };

  const handleRemoveClient = (index: number) => {
    setClientsData(clientsData.filter((_, i) => i !== index));
  };

  const handleAddClient = () => {
    if (newClient.codigo && newClient.nome && newClient.plano) {
      setClientsData([...clientsData, newClient]);
      setNewClient({ codigo: "", nome: "", plano: "" });
      setShowAddForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const clients = clientsData.map((client) => ({
        codigo: client.codigo,
        nome: client.nome,
        plano: client.plano,
      }));

      const payload = {
        domain: formData.domain,
        credentials: {
          username: formData.username,
          password: formData.password,
        },
        platform: formData.platform,
        action: formData.action,
        clients,
        totalClients: clientsData.length,
        timestamp: new Date().toISOString(),
        jobId,
      };

      onSyncStarted?.(jobId);
      onOpenResults?.(jobId);

      fetch("http://localhost:8080/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).catch((error) => {
        console.error("Falha ao iniciar sincronização:", error);
      });

      return;
    } catch (error) {
      setStatus("error");
      setMessage("Erro inesperado ao iniciar sincronização");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.domain &&
    formData.username &&
    formData.password &&
    formData.platform &&
    formData.action &&
    clientsData.length > 0;

  if (showPreview && clientsData.length > 0) {
    return (
      <Card className="bg-white border border-gray-200 rounded-[12px] shadow-[0_1px_2px_rgba(16,24,40,0.06),_0_1px_1px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)] transition-shadow hover:border-gray-300">
        <CardHeader className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle className="text-[1.125rem] font-semibold text-gray-900">
                Preview dos Clientes
              </CardTitle>
              <CardDescription className="text-[0.8125rem] font-semibold text-gray-700 mt-1">
                {clientsData.length} cliente
                {clientsData.length !== 1 ? "s" : ""} na lista
              </CardDescription>
            </div>
            <Badge className="inline-flex h-7 items-center rounded-full bg-gray-100 px-3 text-[0.8125rem] font-semibold text-gray-700">
              {clientsData.length} registros
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">
                Configurações da Sincronização
              </h3>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Domínio
                  </span>
                  <span className="font-medium text-foreground">
                    {formData.domain}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Usuário
                  </span>
                  <span className="font-medium text-foreground">
                    {formData.username}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Plataforma
                  </span>
                  <span className="font-medium text-foreground">
                    {formData.platform}
                  </span>
                </div>
              </div>
            </div>

            {!showAddForm && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="w-full border-dashed bg-transparent"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="mr-2 h-3 w-3" />
                Adicionar Cliente Manualmente
              </Button>
            )}

            {showAddForm && (
              <div className="rounded-md border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Novo Cliente</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-codigo"
                      className="text-[0.8125rem] font-semibold text-gray-700"
                    >
                      Código
                    </Label>
                    <Input
                      id="new-codigo"
                      placeholder="001"
                      value={newClient.codigo}
                      onChange={(e) =>
                        setNewClient({ ...newClient, codigo: e.target.value })
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-nome"
                      className="text-[0.8125rem] font-semibold text-gray-700"
                    >
                      Nome
                    </Label>
                    <Input
                      id="new-nome"
                      placeholder="Nome do cliente"
                      value={newClient.nome}
                      onChange={(e) =>
                        setNewClient({ ...newClient, nome: e.target.value })
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-plano"
                      className="text-[0.8125rem] font-semibold text-gray-700"
                    >
                      Plano
                    </Label>
                    <Input
                      id="new-plano"
                      placeholder="Plano básico"
                      value={newClient.plano}
                      onChange={(e) =>
                        setNewClient({ ...newClient, plano: e.target.value })
                      }
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddClient}
                    disabled={
                      !newClient.codigo || !newClient.nome || !newClient.plano
                    }
                    className="flex-1"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewClient({ codigo: "", nome: "", plano: "" });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-md border bg-card overflow-hidden">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">
                        Código
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Nome
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Plano
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-center w-24">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsData.map((client, index) => (
                      <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="text-sm text-primary font-medium">
                          {client.codigo}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {client.nome}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.plano}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveClient(index)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* {status === "success" && (
              <Alert className="border-accent bg-accent/10">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <AlertDescription className="text-accent-foreground">
                  {message}
                </AlertDescription>
              </Alert>
            )} */}

            {status === "error" && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive text-sm">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowPreview(false)}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar Sincronização
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-[12px] shadow-[0_1px_2px_rgba(16,24,40,0.06),_0_1px_1px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)] transition-shadow hover:border-gray-300">
      <CardHeader className="flex items-center justify-between border-b pb-4">
        <span className="text-[0.9375rem] font-semibold text-[#205266] underline decoration-[#205266] decoration-2 underline-offset-4">
          Configuração
        </span>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="text-muted-foreground hover:text-[#205266]"
          onClick={() => onOpenResults?.(jobId)}
        >
          Resultados
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowPreview(true);
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label
              htmlFor="domain"
              className="text-[0.8125rem] font-semibold text-gray-700"
            >
              Domínio do Sistema
            </Label>
            <Input
              id="domain"
              type="text"
              placeholder="exemplo.com.br"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
              className="h-10 w-full rounded-[12px] border border-gray-300 bg-white px-3.5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:border-black focus-visible:border-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="action"
              className="text-[0.8125rem] font-semibold text-gray-700"
            >
              Ação em Massa
            </Label>
            <Select
              value={formData.action}
              onValueChange={(value) =>
                setFormData({ ...formData, action: value })
              }
            >
              <SelectTrigger
                id="action"
                className="h-10 w-fit rounded-[12px] border border-gray-300 bg-white px-3.5 text-gray-900 placeholder:text-gray-500 focus:border-[#359264] focus:ring-2 focus:ring-[rgba(53,146,100,0.25)] focus:outline-none"
              >
                <SelectValue placeholder="Selecione a ação a ser executada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativacao">Ativação</SelectItem>
                <SelectItem value="bloqueio">Bloqueio</SelectItem>
                <SelectItem value="desbloqueio">Desbloqueio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-[0.8125rem] font-semibold text-gray-700"
              >
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="seu_usuario"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="h-10 w-full rounded-[12px] border border-gray-300 bg-white px-3.5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:border-black focus-visible:border-black"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[0.8125rem] font-semibold text-gray-700"
              >
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="h-10 w-full rounded-[12px] border border-gray-300 bg-white px-3.5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:border-black focus-visible:border-black"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="platform"
              className="text-[0.8125rem] font-semibold text-gray-700"
            >
              Plataforma
            </Label>
            <Select
              value={formData.platform}
              onValueChange={(value) =>
                setFormData({ ...formData, platform: value })
              }
            >
              <SelectTrigger
                id="platform"
                className="h-10 w-fit rounded-[12px] border border-gray-300 bg-white px-3.5 text-gray-900 placeholder:text-gray-500 focus:border-[#359264] focus:ring-2 focus:ring-[rgba(53,146,100,0.25)] focus:outline-none"
              >
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Watch TV">Watch TV</SelectItem>
                <SelectItem value="Playhub">Playhub</SelectItem>
                <SelectItem value="Campsoft">Campsoft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[0.8125rem] font-semibold text-gray-700">
              Planilha de Clientes
            </Label>
            <div className="relative">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileChange}
                className="h-10 w-full rounded-[12px] border border-gray-300 bg-white px-3.5 text-gray-900 placeholder:text-gray-500 focus:border-[#359264] focus:ring-2 focus:ring-[rgba(53,146,100,0.25)] focus:outline-none file:mr-4 file:rounded-[12px] file:border-0 file:bg-[#359264] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#2C7A55]"
              />
              {formData.file && (
                <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Upload className="size-5 text-gray-500 group-hover:text-gray-700" />
                    <span>{formData.file.name}</span>
                    {clientsData.length > 0 && (
                      <Badge className="inline-flex h-7 items-center rounded-full bg-gray-100 px-3 text-[0.8125rem] font-semibold text-gray-700 ml-2">
                        {clientsData.length} clientes
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0 text-gray-700 hover:text-[#2C7A55] hover:bg-[#E7F5EE] rounded-[12px]"
                    aria-label="Remover arquivo"
                  >
                    <Trash2 className="size-5 text-gray-500" />
                  </Button>
                </div>
              )}
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              {/* <p className="text-xs font-medium text-foreground mb-1">
                Formato da planilha:
              </p> */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                A planilha deve conter 3 colunas:{" "}
                <span className="font-medium">Código do Cliente</span>,{" "}
                <span className="font-medium">Nome</span> e{" "}
                <span className="font-medium">Plano</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: CSV, XLSX, XLS, TXT
              </p>
            </div>

            {parseError && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive text-sm">
                  {parseError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex items-center gap-2 justify-start">
            <Button
              type="submit"
              size="xs"
              className="w-fit"
              disabled={!isFormValid}
            >
              <Database className="mr-2 h-3 w-3" />
              Iniciar Sincronização
            </Button>
            {clientsData.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="w-fit border-dashed bg-transparent"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="mr-2 h-3 w-3" />
                Visualizar e Editar Clientes ({clientsData.length})
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
