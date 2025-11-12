import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Users,
  Activity,
  MapPin,
  Calendar,
  Dumbbell,
  Stethoscope,
} from "lucide-react";

const menuItems = [
  {
    title: "Atletas",
    url: "/",
    icon: Users,
  },
  {
    title: "CMJ/SJ",
    url: "/tests",
    icon: Activity,
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
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
