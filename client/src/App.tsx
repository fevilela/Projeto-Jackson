import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Athletes from "@/pages/Athletes";
import Tests from "@/pages/Tests";
import Exercises from "@/pages/Exercises";
import MovementTypes from "@/pages/MovementTypes";
import Running from "@/pages/Running";
import Periodization from "@/pages/Periodization";
import Strength from "@/pages/Strength";
import Assessment from "@/pages/Assessment";
import Anamnese from "@/pages/Anamnese";
import Financial from "@/pages/Financial";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

function MainLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/athletes" component={Athletes} />
              <Route path="/tests" component={Tests} />
              <Route path="/exercises" component={Exercises} />
              <Route path="/movement-types" component={MovementTypes} />
              <Route path="/running" component={Running} />
              <Route path="/periodization" component={Periodization} />
              <Route path="/strength" component={Strength} />
              <Route path="/assessment" component={Assessment} />
              <Route path="/anamnese" component={Anamnese} />
              <Route path="/financial" component={Financial} />
              <Route path="/profile" component={Profile} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/athletes">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/tests">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/exercises">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/movement-types">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/running">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/periodization">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/strength">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/assessment">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/anamnese">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/financial">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
