import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Upload, User } from "lucide-react";

const profileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  birthDate: z.string().optional(),
  cref: z.string().optional(),
  profilePhoto: z.string().optional(),
  dashboardImage: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileData {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  birthDate?: string | null;
  cref?: string | null;
  profilePhoto?: string | null;
  dashboardImage?: string | null;
}

export default function Profile() {
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dashboardPreview, setDashboardPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name || "",
      email: profile?.email || "",
      birthDate: profile?.birthDate || "",
      cref: profile?.cref || "",
      profilePhoto: profile?.profilePhoto || "",
      dashboardImage: profile?.dashboardImage || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        form.setValue("profilePhoto", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDashboardImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setDashboardPreview(base64String);
        form.setValue("dashboardImage", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name?: string | null, username?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Carregando...</div>;
  }

  const displayPhoto = photoPreview || profile?.profilePhoto;
  const displayDashboardImage = dashboardPreview || profile?.dashboardImage;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-profile">
      <div>
        <h1 className="text-3xl font-bold">Perfil Profissional</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações profissionais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
          <CardDescription>
            Atualize seus dados profissionais e foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center gap-4 pb-6 border-b">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={displayPhoto || undefined} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile?.name, profile?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <label htmlFor="photo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("photo-upload")?.click()
                      }
                      data-testid="button-upload-photo"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Alterar Foto
                    </Button>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                    data-testid="input-photo-upload"
                  />
                  <p className="text-sm text-muted-foreground">
                    @{profile?.username}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Seu nome completo"
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-birth-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cref"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CREF</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000000-G/SP"
                          data-testid="input-cref"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Imagem do Dashboard
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Personalize a imagem principal da sua página inicial
                  </p>
                </div>
                {displayDashboardImage && (
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={displayDashboardImage}
                      alt="Preview da imagem do dashboard"
                      className="w-full h-auto max-h-64 object-cover"
                      data-testid="img-dashboard-preview"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label htmlFor="dashboard-upload">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("dashboard-upload")?.click()
                      }
                      data-testid="button-upload-dashboard"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {displayDashboardImage
                        ? "Trocar Imagem"
                        : "Adicionar Imagem"}
                    </Button>
                  </label>
                  <input
                    id="dashboard-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDashboardImageChange}
                    data-testid="input-dashboard-upload"
                  />
                  <p className="text-sm text-muted-foreground">
                    Esta imagem aparecerá no topo da sua página inicial
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
