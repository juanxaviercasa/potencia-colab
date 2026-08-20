import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BookOpen,
  BotMessageSquare,
  Database,
  FolderKanban,
  FlaskConical,
  HardDriveUpload,
  Library,
  LogOut,
  Map,
  NotebookPen,
  PanelLeft,
  Sparkles,
  Target,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: Target, label: "Centro de mando", path: "/" },
  { icon: Map, label: "Mapa de dominio", path: "/roadmap" },
  { icon: FlaskConical, label: "Laboratorios", path: "/labs" },
  { icon: Library, label: "Biblioteca", path: "/library" },
  { icon: Sparkles, label: "Playbooks", path: "/playbooks" },
  { icon: NotebookPen, label: "Bóveda de notas", path: "/notes" },
  { icon: BotMessageSquare, label: "Mentor IA", path: "/mentor" },
  { icon: BookOpen, label: "Recursos", path: "/resources" },
  { icon: HardDriveUpload, label: "Importaciones", path: "/imports" },
  { icon: FolderKanban, label: "Portafolio", path: "/portfolio" },
  { icon: Database, label: "Catálogo de datos", path: "/catalog" },
];

const SIDEBAR_WIDTH_KEY = "colab-atelier-sidebar-width";
const DEFAULT_WIDTH = 276;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 text-center shadow-2xl shadow-black/25">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-300/10">
            <Sparkles className="size-5 text-cyan-200" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Colab Atelier</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Tu centro de entrenamiento está protegido</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Inicia sesión para acceder a tus laboratorios, progreso, notas y mentoría personal.</p>
          <Button onClick={() => startLogin()} size="lg" className="mt-7 w-full">Entrar al centro</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find((item) => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    }
    function handleMouseUp() { setIsResizing(false); }
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div ref={sidebarRef} className="relative">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border/70 bg-sidebar">
          <SidebarHeader className="h-[74px] justify-center border-b border-sidebar-border/70">
            <div className="flex w-full items-center gap-3 px-3">
              <button onClick={toggleSidebar} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white" aria-label="Cambiar tamaño de navegación"><PanelLeft className="size-4" /></button>
              {!isCollapsed && <div className="min-w-0"><p className="text-sm font-semibold tracking-tight text-slate-100"><span className="text-cyan-300">Colab</span> Atelier</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Data Engineering OS</p></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="gap-0 py-3">
            <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 group-data-[collapsible=icon]:hidden">Entrenamiento</p>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item) => {
                const isActive = item.path === location;
                return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 font-medium text-sidebar-foreground transition hover:bg-white/[0.05] data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-100"><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border/70 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="size-9 shrink-0 border border-white/10"><AvatarFallback className="bg-cyan-300/10 text-xs font-semibold text-cyan-100">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium text-slate-200">{user?.name || "Propietario"}</p><p className="mt-1 truncate text-xs text-slate-500">Centro personal</p></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" /><span>Cerrar sesión</span></DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {!isCollapsed && <div className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition hover:bg-cyan-300/30" onMouseDown={() => setIsResizing(true)} />}
      </div>
      <SidebarInset>
        {isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-white/10 bg-background/95 px-3 backdrop-blur"><SidebarTrigger className="size-9 rounded-lg bg-white/[0.04]" /><span className="text-sm font-medium text-foreground">{activeMenuItem?.label ?? "Centro de entrenamiento"}</span></div>}
        <main className="min-h-screen flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
