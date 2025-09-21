"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export function SettingsForm() {
  const settings = useQuery(api.adminsettings.getSettings, {})
  const updateSettings = useMutation(api.adminsettings.updateSettings)

  const [formData, setFormData] = useState({
    storeName: "",
    storeDescription: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    freeShippingThreshold: 0,
    defaultShippingFee: 0,
    taxRate: 0,
    currency: "MZN",
  })

  const [socialMedia, setSocialMedia] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    whatsapp: "",
  })

  const [seoSettings, setSeoSettings] = useState({
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    googleAnalytics: "",
    facebookPixel: "",
  })

  const [paymentMethods, setPaymentMethods] = useState({
    creditCard: false,
    debitCard: false,
    pix: false,
    boleto: false,
    paypal: false,
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        storeName: settings.storeName || "",
        storeDescription: settings.storeDescription || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        address: settings.address || "",
        freeShippingThreshold: settings.freeShippingThreshold || 0,
        defaultShippingFee: settings.defaultShippingFee || 0,
        taxRate: settings.taxRate || 0,
        currency: settings.currency || "MZN",
      })

      setSocialMedia(
        settings.socialMedia || {
          facebook: "",
          instagram: "",
          twitter: "",
          whatsapp: "",
        },
      )

      setSeoSettings(
        settings.seoSettings || {
          metaTitle: "",
          metaDescription: "",
          keywords: "",
          googleAnalytics: "",
          facebookPixel: "",
        },
      )

      const methods = settings.paymentMethods || []
      setPaymentMethods({
        creditCard: methods.includes("creditCard"),
        debitCard: methods.includes("debitCard"),
        pix: methods.includes("pix"),
        boleto: methods.includes("boleto"),
        paypal: methods.includes("paypal"),
      })
    }
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const enabledPaymentMethods = Object.entries(paymentMethods)
        .filter(([_, enabled]) => enabled)
        .map(([method, _]) => method)

      await updateSettings({
        ...formData,
        socialMedia,
        seoSettings,
        paymentMethods: enabledPaymentMethods,
      })

      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="shipping">Entrega</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="storeDescription">Descrição</Label>
                <Textarea
                  id="storeDescription"
                  value={formData.storeDescription}
                  onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email de Contato</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultShippingFee">Taxa de Entrega Padrão (MT)</Label>
                <Input
                  id="defaultShippingFee"
                  type="number"
                  step="0.01"
                  value={formData.defaultShippingFee}
                  onChange={(e) => setFormData({ ...formData, defaultShippingFee: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="freeShippingThreshold">Frete Grátis Acima de (MT)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  step="0.01"
                  value={formData.freeShippingThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, freeShippingThreshold: Number.parseFloat(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number.parseFloat(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(paymentMethods).map(([method, enabled]) => (
                <div key={method} className="flex items-center space-x-2">
                  <Switch
                    id={method}
                    checked={enabled}
                    onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, [method]: checked })}
                  />
                  <Label htmlFor={method} className="capitalize">
                    {method === "creditCard" && "Cartão de Crédito"}
                    {method === "debitCard" && "Cartão de Débito"}
                    {method === "pix" && "PIX"}
                    {method === "boleto" && "Boleto"}
                    {method === "paypal" && "PayPal"}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={socialMedia.facebook}
                  onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                  placeholder="https://facebook.com/suapagina"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={socialMedia.instagram}
                  onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                  placeholder="https://instagram.com/seuusuario"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={socialMedia.whatsapp}
                  onChange={(e) => setSocialMedia({ ...socialMedia, whatsapp: e.target.value })}
                  placeholder="5511999999999"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Título Meta</Label>
                <Input
                  id="metaTitle"
                  value={seoSettings.metaTitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Descrição Meta</Label>
                <Textarea
                  id="metaDescription"
                  value={seoSettings.metaDescription}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="keywords">Palavras-chave</Label>
                <Input
                  id="keywords"
                  value={seoSettings.keywords}
                  onChange={(e) => setSeoSettings({ ...seoSettings, keywords: e.target.value })}
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>
              <div>
                <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                <Input
                  id="googleAnalytics"
                  value={seoSettings.googleAnalytics}
                  onChange={(e) => setSeoSettings({ ...seoSettings, googleAnalytics: e.target.value })}
                  placeholder="GA-XXXXXXXXX-X"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button type="submit" size="lg" className="w-full">
        Salvar Configurações
      </Button>
    </form>
  )
}
