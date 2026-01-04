import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { frontendTextsService } from "@/services/frontendTextsService";
import { Search, Save, RotateCcw, Download, Upload, AlertCircle } from "lucide-react";

type FrontendText = {
  id: string;
  key: string;
  page: string;
  section: string | null;
  category: string | null;
  label: string;
  value: string;
  default_value: string;
  description: string | null;
};

export default function TextosFrontendPage() {
  const { toast } = useToast();
  const [groupedTexts, setGroupedTexts] = useState<Record<string, Record<string, FrontendText[]>>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    try {
      setLoading(true);
      const data = await frontendTextsService.getGrouped();
      setGroupedTexts(data);
    } catch (error) {
      console.error("Error loading texts:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar textos do frontend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (key: string, value: string) => {
    setEditedTexts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(editedTexts).map(([key, value]) => ({
        key,
        value,
      }));

      await frontendTextsService.bulkUpdate(updates);

      toast({
        title: "Sucesso",
        description: `${updates.length} texto(s) atualizado(s) com sucesso`,
      });

      setEditedTexts({});
      await loadTexts();
    } catch (error) {
      console.error("Error saving texts:", error);
      toast({
        title: "Erro",
        description: "Erro ao guardar textos",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetText = async (key: string) => {
    try {
      await frontendTextsService.resetToDefault(key);
      toast({
        title: "Sucesso",
        description: "Texto reposto para o valor padrão",
      });
      await loadTexts();
      // Remove from edited texts
      setEditedTexts((prev) => {
        const newEdited = { ...prev };
        delete newEdited[key];
        return newEdited;
      });
    } catch (error) {
      console.error("Error resetting text:", error);
      toast({
        title: "Erro",
        description: "Erro ao repor texto",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const jsonData = await frontendTextsService.exportTexts();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `frontend-texts-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Textos exportados com sucesso",
      });
    } catch (error) {
      console.error("Error exporting texts:", error);
      toast({
        title: "Erro",
        description: "Erro ao exportar textos",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await frontendTextsService.importTexts(text);

      toast({
        title: "Sucesso",
        description: "Textos importados com sucesso",
      });

      await loadTexts();
    } catch (error) {
      console.error("Error importing texts:", error);
      toast({
        title: "Erro",
        description: "Erro ao importar textos. Verifique o formato do ficheiro.",
        variant: "destructive",
      });
    }
  };

  const getTextValue = (text: FrontendText) => {
    return editedTexts[text.key] !== undefined ? editedTexts[text.key] : text.value;
  };

  const isTextEdited = (key: string) => {
    return editedTexts[key] !== undefined;
  };

  const filterTexts = (texts: FrontendText[]) => {
    if (!searchTerm) return texts;
    const term = searchTerm.toLowerCase();
    return texts.filter(
      (text) =>
        text.label.toLowerCase().includes(term) ||
        text.key.toLowerCase().includes(term) ||
        text.value.toLowerCase().includes(term)
    );
  };

  const hasUnsavedChanges = Object.keys(editedTexts).length > 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">A carregar textos...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Textos do Frontend</h1>
            <p className="text-muted-foreground mt-2">
              Gerir todos os textos exibidos no frontend da aplicação
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {hasUnsavedChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Tem {Object.keys(editedTexts).length} texto(s) por guardar
              </span>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar textos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="home" className="space-y-4">
          <TabsList>
            {Object.keys(groupedTexts).map((page) => (
              <TabsTrigger key={page} value={page} className="capitalize">
                {page === "home" && "Página Inicial"}
                {page === "rooms" && "Quartos"}
                {page === "checkout" && "Checkout"}
                {page === "common" && "Comuns"}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedTexts).map(([page, sections]) => (
            <TabsContent key={page} value={page} className="space-y-6">
              {Object.entries(sections).map(([section, texts]) => {
                const filteredSectionTexts = filterTexts(texts);
                if (filteredSectionTexts.length === 0) return null;

                return (
                  <Card key={section}>
                    <CardHeader>
                      <CardTitle className="capitalize">
                        {section === "default" ? "Geral" : section}
                      </CardTitle>
                      <CardDescription>
                        {filteredSectionTexts.length} texto(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {filteredSectionTexts.map((text) => {
                        const currentValue = getTextValue(text);
                        const isEdited = isTextEdited(text.key);
                        const isLongText = text.value.length > 100;

                        return (
                          <div key={text.key} className="space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Label className="font-medium">{text.label}</Label>
                                  {isEdited && (
                                    <Badge variant="secondary" className="text-xs">
                                      Editado
                                    </Badge>
                                  )}
                                  {text.category && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {text.category}
                                    </Badge>
                                  )}
                                </div>
                                {text.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {text.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground font-mono">
                                  {text.key}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetText(text.key)}
                                disabled={!isEdited && text.value === text.default_value}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>

                            {isLongText ? (
                              <Textarea
                                value={currentValue}
                                onChange={(e) => handleTextChange(text.key, e.target.value)}
                                rows={4}
                                className={isEdited ? "border-blue-500" : ""}
                              />
                            ) : (
                              <Input
                                value={currentValue}
                                onChange={(e) => handleTextChange(text.key, e.target.value)}
                                className={isEdited ? "border-blue-500" : ""}
                              />
                            )}

                            {text.value !== text.default_value && (
                              <p className="text-xs text-muted-foreground">
                                Padrão: {text.default_value}
                              </p>
                            )}

                            <Separator />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>

        {hasUnsavedChanges && (
          <div className="fixed bottom-8 right-8">
            <Button size="lg" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "A guardar..." : `Guardar ${Object.keys(editedTexts).length} Alterações`}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}