import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
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
import type { FinancialTransaction } from "@shared/schema";

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

  const { data: transactions = [] } = useQuery<
    (FinancialTransaction & { athleteName?: string | null })[]
  >({
    queryKey: ["/api/financial-transactions"],
  });

  const pendingRemindersCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    return transactions.filter((transaction) => {
      if (!transaction.athleteId) return false;

      // Se está totalmente pago, não mostrar
      const totalAmount = parseFloat(transaction.totalAmount);
      const paidAmount = parseFloat(transaction.paidAmount);
      if (paidAmount >= totalAmount) return false;

      const dueDate = new Date(transaction.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const isOverdue = dueDate < today;
      const isDueSoon = dueDate >= today && dueDate <= threeDaysFromNow;

      return isOverdue || isDueSoon;
    }).length;
  }, [transactions]);

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
                      {item.url === "/financial" &&
                        pendingRemindersCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto animate-pulse"
                            data-testid="badge-financial-notifications"
                          >
                            {pendingRemindersCount}
                          </Badge>
                        )}
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
