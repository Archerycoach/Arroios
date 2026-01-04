import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  User, 
  Lock, 
  CreditCard, 
  Mail, 
  Globe, 
  Bell,
  FileText
} from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-2">
            Gerir configurações da propriedade e perfil
          </p>
        </div>

        <Tabs defaultValue="property" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="property">Propriedade</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="payment">Pagamentos</TabsTrigger>
            <TabsTrigger value="policies">Políticas</TabsTrigger>
          </TabsList>

          {/* Property Settings */}
          <TabsContent value="property" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações da Propriedade
                </CardTitle>
                <CardDescription>
                  Informações básicas sobre o seu alojamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="property-name">Nome da Propriedade</Label>
                  <Input id="property-name" placeholder="Gestão Arroios" defaultValue="Gestão Arroios" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property-address">Morada</Label>
                  <Input id="property-address" placeholder="Rua dos Arroios..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="property-city">Cidade</Label>
                    <Input id="property-city" placeholder="Lisboa" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property-postal">Código Postal</Label>
                    <Input id="property-postal" placeholder="1000-000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property-description">Descrição</Label>
                  <Textarea 
                    id="property-description" 
                    placeholder="Descrição do alojamento..."
                    rows={4}
                  />
                </div>
                <Button>Guardar Alterações</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configurações Regionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select defaultValue="europe-lisbon">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-lisbon">Europe/Lisbon (GMT+0)</SelectItem>
                      <SelectItem value="europe-london">Europe/London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select defaultValue="eur">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Guardar</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Nome</Label>
                    <Input id="first-name" placeholder="João" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Apelido</Label>
                    <Input id="last-name" placeholder="Silva" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="joao@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" type="tel" placeholder="+351 912 345 678" />
                </div>
                <Button>Atualizar Perfil</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password Atual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>Alterar Password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe Integration
                </CardTitle>
                <CardDescription>
                  Configure o Stripe para processar pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-key">Stripe Publishable Key</Label>
                  <Input id="stripe-key" placeholder="pk_live_..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                  <Input id="stripe-secret" type="password" placeholder="sk_live_..." />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo de Teste</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar chaves de teste do Stripe
                    </p>
                  </div>
                  <Switch />
                </div>
                <Button>Guardar Configuração</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies */}
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Políticas de Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="check-in">Horário de Check-in</Label>
                  <Input id="check-in" type="time" defaultValue="14:00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-out">Horário de Check-out</Label>
                  <Input id="check-out" type="time" defaultValue="11:00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellation-policy">Política de Cancelamento</Label>
                  <Select defaultValue="flexible">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Flexível (24h antes)</SelectItem>
                      <SelectItem value="moderate">Moderada (7 dias antes)</SelectItem>
                      <SelectItem value="strict">Estrita (30 dias antes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum-nights">Mínimo de Noites</Label>
                  <Input id="minimum-nights" type="number" defaultValue="1" />
                </div>
                <Button>Guardar Políticas</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nova Reserva</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber email quando há nova reserva
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagamento Recebido</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando pagamento é confirmado
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cancelamento</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertar quando reserva é cancelada
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Guardar Preferências</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}