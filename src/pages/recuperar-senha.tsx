import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { authService } from "@/services/authService";
import SEO from "@/components/SEO";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor insira o seu email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authService.requestPasswordReset(email);

      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível enviar o email",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique a sua caixa de entrada para instruções de reset de senha",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Recuperar Senha | Gestão Arroios"
        description="Recupere o acesso à sua conta"
      />
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Recuperar Senha
              </h1>
              <p className="text-gray-600">
                Insira o seu email para receber instruções de recuperação
              </p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Reset de Senha
                </CardTitle>
                <CardDescription>
                  Enviaremos um link de recuperação para o seu email
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!emailSent ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          A enviar...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Email de Recuperação
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm">
                        ✅ Email enviado com sucesso! Verifique a sua caixa de entrada e siga as instruções para redefinir a sua senha.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/login")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar ao Login
                    </Button>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← Voltar ao login
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
              <p className="font-semibold mb-2">ℹ️ Nota importante:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>O email pode demorar alguns minutos a chegar</li>
                <li>Verifique também a pasta de spam/lixo</li>
                <li>O link de reset é válido por 1 hora</li>
              </ul>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}