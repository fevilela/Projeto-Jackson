import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  Activity,
  MapPin,
  Calendar,
  Dumbbell,
  Stethoscope,
  ClipboardList,
  ChevronDown,
  UserPlus,
  ClipboardCheck,
  Weight,
  Layers,
  FileText,
  Home,
  DollarSign,
  UserCircle,
} from "lucide-react";

const cadastroItems = [
  {
    title: "Atletas",
    url: "/athletes",
    icon: UserPlus,
  },
  {
    title: "Tipos de Movimento",
    url: "/movement-types",
    icon: Layers,
  },
  {
    title: "Exercício",
    url: "/exercises",
    icon: Weight,
  },
];

const otherMenuItems = [
  {
    title: "Anamnese",
    url: "/anamnese",
    icon: FileText,
  },
  {
    title: "Teste/Movimento",
    url: "/tests",
    icon: ClipboardCheck,
  },
  {
    title: "Corrida",
    url: "/running",
    icon: MapPin,
  },
  {
    title: "Periodização",
    url: "/periodization",
    icon: Calendar,
  },
  {
    title: "Força",
    url: "/strength",
    icon: Dumbbell,
  },
  {
    title: "Avaliação Funcional",
    url: "/assessment",
    icon: Stethoscope,
  },
  {
    title: "Financeiro",
    url: "/financial",
    icon: DollarSign,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [isCadastroOpen, setIsCadastroOpen] = useState(true);

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/"}
                  data-testid="sidebar-item-dashboard"
                >
                  <Link href="/">
                    <Home />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible
                open={isCadastroOpen}
                onOpenChange={setIsCadastroOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-testid="sidebar-item-cadastro">
                      <ClipboardList />
                      <span>Cadastro</span>
                      <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {cadastroItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === item.url}
                            data-testid={`sidebar-subitem-${item.title.toLowerCase()}`}
                          >
                            <Link href={item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {otherMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-item-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
