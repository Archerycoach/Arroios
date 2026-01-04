import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editCategory?: any;
}

const colorOptions = [
  { value: "#3b82f6", label: "Azul", bg: "bg-blue-500" },
  { value: "#10b981", label: "Verde", bg: "bg-green-500" },
  { value: "#f59e0b", label: "Amarelo", bg: "bg-yellow-500" },
  { value: "#ef4444", label: "Vermelho", bg: "bg-red-500" },
  { value: "#8b5cf6", label: "Roxo", bg: "bg-purple-500" },
  { value: "#ec4899", label: "Rosa", bg: "bg-pink-500" },
  { value: "#6b7280", label: "Cinza", bg: "bg-gray-500" },
];

export function CreateCategoryDialog({ open, onOpenChange, onSuccess, editCategory }: CreateCategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: editCategory?.name || "",
    color: editCategory?.color || "#3b82f6",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editCategory) {
        // Update existing category
        const { error } = await supabase
          .from("expense_categories")
          .update(formData)
          .eq("id", editCategory.id);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from("expense_categories")
          .insert([formData]);

        if (error) throw error;
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        color: "#3b82f6",
      });
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Erro ao guardar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editCategory ? "Editar" : "Nova"} Categoria</DialogTitle>
          <DialogDescription>
            {editCategory ? "Atualize os dados da categoria" : "Crie uma nova categoria de despesa"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Limpeza, Manutenção, Utilities..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor *</Label>
            <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${color.bg}`} />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editCategory ? "Atualizar" : "Criar"} Categoria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}