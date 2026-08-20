import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HomeDashboard, LabsPage, LibraryPage, MentorPage, NotesPage, PlaybooksPage, ResourcesPage, RoadmapPage } from "./pages/AcademyPages";

function Router() {
  return (
    <DashboardLayout><Switch>
      <Route path={"/"} component={HomeDashboard} />
      <Route path={"/roadmap"} component={RoadmapPage} />
      <Route path={"/labs"} component={LabsPage} />
      <Route path={"/library"} component={LibraryPage} />
      <Route path={"/playbooks"} component={PlaybooksPage} />
      <Route path={"/notes"} component={NotesPage} />
      <Route path={"/mentor"} component={MentorPage} />
      <Route path={"/resources"} component={ResourcesPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch></DashboardLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
