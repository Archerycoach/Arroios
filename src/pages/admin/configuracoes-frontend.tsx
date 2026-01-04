import { useState, useEffect, FormEvent } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { ProtectedAdminPage } from "@/components/Admin/ProtectedAdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { settingsService, PropertySettings } from "@/services/settingsService";
import { uploadService } from "@/services/uploadService";
import { Loader2, Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function ConfiguracoesFrontend() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PropertySettings>({
    name: "",
    amenities: [],
    footer: {
      address: "",
      phone: "",
      email: "",
      social: {},
    },
    gallery_images: [],
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getPropertySettings();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePropertyName = async () => {
    setIsSaving(true);
    try {
      await settingsService.updatePropertyName(settings.name);
      toast({
        title: "Sucesso",
        description: "Nome da propriedade atualizado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar nome",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const upload = await uploadService.uploadAndRecord(file, "logo");
      await settingsService.updateLogoUrl(upload.file_path);
      setSettings({ ...settings, logo_url: upload.file_path });
      toast({
        title: "Sucesso",
        description: "Logo atualizado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do logo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    const updatedAmenities = [...settings.amenities, newAmenity.trim()];
    setSettings({ ...settings, amenities: updatedAmenities });
    setNewAmenity("");
  };

  const handleRemoveAmenity = (index: number) => {
    const updatedAmenities = settings.amenities.filter((_, i) => i !== index);
    setSettings({ ...settings, amenities: updatedAmenities });
  };

  const handleSaveAmenities = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateAmenities(settings.amenities);
      toast({
        title: "Sucesso",
        description: "Comodidades atualizadas",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar comodidades",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadService.uploadAndRecord(file, "gallery")
      );
      const uploads = await Promise.all(uploadPromises);
      const newImages = uploads.map((u) => u.file_path);
      const updatedGallery = [...settings.gallery_images, ...newImages];
      
      await settingsService.updateGalleryImages(updatedGallery);
      setSettings({ ...settings, gallery_images: updatedGallery });
      
      toast({
        title: "Sucesso",
        description: `${uploads.length} foto(s) adicionada(s)`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload das fotos",
        variant: "destructive",
      });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = async (index: number) => {
    const updatedGallery = settings.gallery_images.filter((_, i) => i !== index);
    try {
      await settingsService.updateGalleryImages(updatedGallery);
      setSettings({ ...settings, gallery_images: updatedGallery });
      toast({
        title: "Sucesso",
        description: "Foto removida",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover foto",
        variant: "destructive",
      });
    }
  };

  const handleSaveFooter = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateFooter(settings.footer);
      toast({
        title: "Sucesso",
        description: "Informações do rodapé atualizadas",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar rodapé",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ProtectedAdminPage>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações do Frontend</h1>
            <p className="text-muted-foreground mt-1">
              Configure a aparência e informações do site público
            </p>
          </div>

          {/* Property Name */}
          <Card>
            <CardHeader>
              <CardTitle>Nome do Estabelecimento</CardTitle>
              <CardDescription>
                Este nome aparecerá no cabeçalho e rodapé do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="property-name">Nome</Label>
                <Input
                  id="property-name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  placeholder="Nome do Estabelecimento"
                />
              </div>
              <Button onClick={handleSavePropertyName} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar Nome
              </Button>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Logo que aparecerá no canto superior esquerdo (recomendado: 200x60px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.logo_url && (
                <div className="relative w-48 h-16 border rounded-lg overflow-hidden">
                  <Image
                    src={settings.logo_url}
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md w-fit hover:bg-primary/90">
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {settings.logo_url ? "Alterar Logo" : "Upload Logo"}
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                />
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Comodidades Incluídas</CardTitle>
              <CardDescription>
                Liste as comodidades que estão incluídas nas reservas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Ex: Wi-Fi Gratuito, Ar Condicionado..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAmenity();
                    }
                  }}
                />
                <Button onClick={handleAddAmenity} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {settings.amenities.length > 0 && (
                <div className="space-y-2">
                  {settings.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span>{amenity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAmenity(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSaveAmenities} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar Comodidades
              </Button>
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Galeria de Fotos</CardTitle>
              <CardDescription>
                Fotos do estabelecimento que aparecerão no site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gallery-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md w-fit hover:bg-primary/90">
                    {isUploadingGallery ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    Adicionar Fotos
                  </div>
                </Label>
                <Input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryUpload}
                  disabled={isUploadingGallery}
                />
              </div>

              {settings.gallery_images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {settings.gallery_images.map((image, index) => (
                    <div key={index} className="relative aspect-video border rounded-lg overflow-hidden group">
                      <Image
                        src={image}
                        alt={`Galeria ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveGalleryImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Rodapé</CardTitle>
              <CardDescription>
                Informações de contato que aparecerão no rodapé do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footer-address">Endereço</Label>
                <Input
                  id="footer-address"
                  value={settings.footer.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, address: e.target.value },
                    })
                  }
                  placeholder="Rua, Cidade, Código Postal"
                />
              </div>

              <div>
                <Label htmlFor="footer-phone">Telefone</Label>
                <Input
                  id="footer-phone"
                  value={settings.footer.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, phone: e.target.value },
                    })
                  }
                  placeholder="+351 XXX XXX XXX"
                />
              </div>

              <div>
                <Label htmlFor="footer-email">Email</Label>
                <Input
                  id="footer-email"
                  type="email"
                  value={settings.footer.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, email: e.target.value },
                    })
                  }
                  placeholder="contacto@exemplo.com"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Redes Sociais (Opcional)</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="footer-facebook">Facebook</Label>
                    <Input
                      id="footer-facebook"
                      value={settings.footer.social?.facebook || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          footer: {
                            ...settings.footer,
                            social: { ...settings.footer.social, facebook: e.target.value },
                          },
                        })
                      }
                      placeholder="https://facebook.com/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="footer-instagram">Instagram</Label>
                    <Input
                      id="footer-instagram"
                      value={settings.footer.social?.instagram || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          footer: {
                            ...settings.footer,
                            social: { ...settings.footer.social, instagram: e.target.value },
                          },
                        })
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="footer-twitter">Twitter / X</Label>
                    <Input
                      id="footer-twitter"
                      value={settings.footer.social?.twitter || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          footer: {
                            ...settings.footer,
                            social: { ...settings.footer.social, twitter: e.target.value },
                          },
                        })
                      }
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveFooter} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar Informações do Rodapé
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedAdminPage>
    </AdminLayout>
  );
}