"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Resultados({ params: { jobId } }: { params: { jobId: string } }) {
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/sync/results/${jobId}`, { cache: "no-store" });
        const json = await res.json();
        if (!active) return;

        setStatus(json.status ?? "pending");
        setData(json);

        if (json.status === "pending") {
          setTimeout(poll, 2000);
        }
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

  return (
    <main className="min-h-screen bg-bg-page">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#205266]">
            <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-1/2 after:bg-[#359264]">
              Resultados
            </span>{" "}
            da Sincronização
          </h1>
        </div>

        <div className="mx-auto max-w-5xl">
          <Card className="bg-white border border-gray-200 rounded-[12px]">
            <CardHeader>
              <CardTitle className="text-[1.125rem] font-semibold text-[#205266]">
                {status === "pending"
                  ? "Aguardando resposta do N8n..."
                  : status === "success"
                  ? "Sincronização concluída"
                  : "Erro na sincronização"}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              {status === "pending" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    Estamos processando sua sincronização. Assim que o N8n enviar o retorno, mostramos aqui.
                  </span>
                </div>
              )}

              {status === "success" && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-[#2C7A55]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Processo concluído com sucesso.</span>
                  </div>
                  <pre className="rounded-md border bg-muted/30 p-3 overflow-auto">
                    {JSON.stringify(data.payload ?? data, null, 2)}
                  </pre>
                </div>
              )}

              {status === "error" && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Ocorreu um erro no processo.</span>
                  </div>
                  <pre className="rounded-md border bg-destructive/10 p-3 overflow-auto">
                    {JSON.stringify(data.payload ?? data, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Link href="/">
                  <Button type="button" variant="outline" size="xs" className="w-fit bg-transparent">
                    Voltar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}