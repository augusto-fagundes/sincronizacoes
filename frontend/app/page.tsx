"use client";

import { useState, useEffect } from "react";
import { ClientSyncForm } from "@/components/client-sync-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"config" | "resultados">("config");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-bg-page">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#205266]">
            <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-1/2 after:bg-[#359264]">
              Sincronização
            </span>{" "}
            em Massa
          </h1>
        </div>

        <div className="mx-auto max-w-5xl">
          {activeTab === "config" ? (
            <ClientSyncForm
              onOpenResults={(jobId) => {
                setCurrentJobId(jobId);
                setActiveTab("resultados");
              }}
              onSyncStarted={(jobId) => {
                setCurrentJobId(jobId);
              }}
            />
          ) : (
            <Card className="bg-white border border-gray-200 rounded-[12px]">
              <CardHeader className="flex items-center justify-between border-b pb-4">
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="text-muted-foreground hover:text-[#205266]"
                  onClick={() => setActiveTab("config")}
                >
                  Configuração
                </Button>
                <span className="text-[0.9375rem] font-semibold text-[#205266] underline decoration-[#205266] decoration-2 underline-offset-4">
                  Resultados
                </span>
              </CardHeader>
              <CardContent className="pt-6">
                {currentJobId ? (
                  <ResultsPanel jobId={currentJobId} />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Nenhum processo de sincronização em andamento ou concluído.
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="w-fit bg-transparent"
                    onClick={() => setActiveTab("config")}
                  >
                    Voltar para Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function ResultsPanel({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [data, setData] = useState<any>(null);

  // simple polling
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/sync/results/${jobId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!active) return;
        setStatus(json.status ?? "pending");
        setData(json);
        if (json.status === "pending") setTimeout(poll, 2000);
      } catch {
        if (!active) return;
        setTimeout(poll, 2000);
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [jobId]);

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block size-4 rounded-full border-2 border-muted-foreground/40 border-t-transparent animate-spin" />
        <span>Aguardando resposta do N8n...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3 text-sm">
        <div className="text-destructive">
          Ocorreu um erro na sincronização.
        </div>
        <pre className="rounded-md border bg-destructive/10 p-3 overflow-auto">
          {JSON.stringify(data?.payload ?? data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="text-[#2C7A55]">Processo concluído com sucesso.</div>
      <pre className="rounded-md border bg-muted/30 p-3 overflow-auto">
        {JSON.stringify(data?.payload ?? data, null, 2)}
      </pre>
    </div>
  );
}
