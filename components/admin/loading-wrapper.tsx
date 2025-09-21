"use client"

import type React from "react"

import { useStore } from "@/contexts/store-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminLoadingWrapperProps {
  children: React.ReactNode
}

export function AdminLoadingWrapper({ children }: AdminLoadingWrapperProps) {
  const { isLoading, hasNoStores, selectedStore } = useStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Carregando dados das lojas...</p>
        </div>
      </div>
    )
  }

  if (hasNoStores) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Nenhuma Loja Encontrada</CardTitle>
            <CardDescription>Você não possui nenhuma loja vinculada à sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Para acessar o painel administrativo, você precisa ter pelo menos uma loja configurada.
            </p>
            <Button onClick={() => window.open("mailto:suporte@exemplo.com", "_blank")} className="w-full">
              Contactar Suporte
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Selecione uma Loja</CardTitle>
            <CardDescription>Nenhuma loja está selecionada no momento.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Por favor, selecione uma loja no cabeçalho para continuar.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
