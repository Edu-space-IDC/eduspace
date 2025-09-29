import { useState } from "react";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { TeacherList } from "./components/TeacherList";
import { Navigation } from "./components/Navigation";
import { AuthScreen } from "./components/AuthScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { GroupSelector } from "./components/GroupSelector";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { DevToolsPanel } from "./components/DevToolsPanel";
import { BackendStatus } from "./components/BackendStatus";
import { ErrorBoundary } from "./components/ErrorBoundary";
// TEMPORALMENTE DESACTIVADO
// import { ThemeToggle } from "./components/ThemeToggle";
import { useAppInitialization } from "./utils/useAppInitialization";
import { useAuthState } from "./utils/useAuthState";
// TEMPORALMENTE DESACTIVADO
// import { useTheme } from "./utils/useTheme";
import { handleDevReset } from "./utils/devReset";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
// Logo institucional - Puedes cambiar esta URL por tu logo personalizado
import logoInstitucional from "./assets/logo1.png";
import {
  isDevelopment,
  type View,
  type Teacher,
} from "./utils/types";

export default function App() {
  const [activeView, setActiveView] =
    useState<View>("dashboard");
  const [showGroupSelector, setShowGroupSelector] =
    useState(false);
  const [resetInProgress, setResetInProgress] = useState(false);
  const [hideNavigation, setHideNavigation] = useState(false);

  const { dbInitialized, initError, isFirstInstall } =
    useAppInitialization();
  const {
    authState,
    currentTeacher,
    setAuthState,
    handleLogin,
    handleLogout,
    handleGroupSelect,
    updateCurrentTeacher,
  } = useAuthState();
  
  // TEMPORALMENTE DESACTIVADO - Hook para manejar el tema (modo claro/oscuro)
  // const { theme } = useTheme();

  const onDevReset = () =>
    handleDevReset(setResetInProgress, () => {
      setActiveView("dashboard");
      setShowGroupSelector(false);
      setHideNavigation(false);
      handleLogout();
    });

  const handleGroupSelectWrapper = async (group: string) => {
    await handleGroupSelect(group);
    setShowGroupSelector(false);
  };

  const handleAttendanceFormToggle = (isOpen: boolean) => {
    setHideNavigation(isOpen);
  };

  // Verificar roles
  const isAdmin = currentTeacher?.role === "admin";

  // Mostrar pantallas de carga/error
  if (initError) {
    return (
      <ErrorScreen
        error={initError}
        isDevelopment={isDevelopment()}
        onDevReset={onDevReset}
        resetInProgress={resetInProgress}
      />
    );
  }

  if (!dbInitialized) {
    return (
      <LoadingScreen
        isFirstInstall={isFirstInstall}
        isDevelopment={isDevelopment()}
        onDevReset={onDevReset}
        resetInProgress={resetInProgress}
      />
    );
  }

  // Renderizar contenido principal
  const renderContent = () => {
    if (authState !== "authenticated" || !currentTeacher) {
      return (
        <AuthScreen
          authState={authState}
          onStateChange={setAuthState}
          onLogin={handleLogin}
        />
      );
    }

    if (showGroupSelector) {
      return (
        <GroupSelector
          currentGroup={currentTeacher.selectedGroup}
          onGroupSelect={handleGroupSelectWrapper}
          onBack={() => setShowGroupSelector(false)}
          teacherId={currentTeacher.id}
        />
      );
    }

    switch (activeView) {
      case "dashboard":
        return (
          <TeacherDashboard
            teacher={currentTeacher}
            onGroupSelect={() => {
              setShowGroupSelector(true);
              setHideNavigation(false); // Resetear al abrir selector de grupo
            }}
            onAttendanceFormToggle={handleAttendanceFormToggle}
            onTeacherUpdate={updateCurrentTeacher}
          />
        );
      case "teachers":
        return <TeacherList />;
      case "profile":
        return (
          <ProfileScreen
            teacher={currentTeacher}
            onLogout={handleLogout}
            onBack={() => setActiveView("dashboard")}
            onTeacherUpdate={updateCurrentTeacher}
          />
        );
      case "admin":
        if (isAdmin) {
          return (
            <AdminDashboard
              teacher={currentTeacher}
              onBack={() => setActiveView("dashboard")}
            />
          );
        } else {
          setActiveView("dashboard");
          return null;
        }
      default:
        return (
          <TeacherDashboard
            teacher={currentTeacher}
            onGroupSelect={() => setShowGroupSelector(true)}
            onTeacherUpdate={updateCurrentTeacher}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background relative">
        {/* Toggle de tema en esquina superior izquierda - TEMPORALMENTE DESACTIVADO */}
        {/* 
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-border">
            <ThemeToggle variant="icon" size="sm" />
          </div>
        </div>
        */}

        {/* Logo institucional en esquina superior derecha */}
        <div className="fixed top-4 right-4 z-50">
          {/* Opción con imagen usando ImageWithFallback */}
          <ImageWithFallback
            src={logoInstitucional} 
            alt="Institución Educativa Nuevo Latir" 
            className="h-16 w-auto drop-shadow-sm"
            fallback={
              <div className="h-16 w-16 bg-purple-primary rounded-full border-2 border-white/50 flex items-center justify-center drop-shadow-sm">
                <div className="text-white font-bold text-xs text-center leading-tight">
                  <div>IE</div>
                  <div>NUEVO</div>
                  <div>LATIR</div>
                </div>
              </div>
            }
          />
          
          {/* Opción alternativa SOLO con texto (descomenta para usar en lugar de la imagen):
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="text-purple-primary font-bold text-sm">IE NUEVO</div>
            <div className="text-purple-primary text-xs">LATIR</div>
          </div>
          */}
        </div>

        <main
          className={authState === "authenticated" ? "pb-16" : ""}
        >
          {renderContent()}
        </main>

        {authState === "authenticated" && !hideNavigation && (
          <Navigation
            activeView={activeView}
            onViewChange={(view) => {
              setActiveView(view);
              setHideNavigation(false); // Resetear el estado al cambiar de vista
            }}
            userRole={currentTeacher?.role || "teacher"}
          />
        )}

        {isDevelopment() && (
          <DevToolsPanel
            isFirstInstall={isFirstInstall}
            currentTeacher={currentTeacher}
            authState={authState}
            onDevReset={onDevReset}
            resetInProgress={resetInProgress}
          />
        )}

        <BackendStatus />
      </div>
    </ErrorBoundary>
  );
}

export type { Teacher };

// Nota de archivos obsoletos que se pueden eliminar después de confirmar que todo funciona:
// Los siguientes archivos ya no se usan en el sistema simplificado:
// - /components/QRGenerator.tsx (sistema QR eliminado)
// - /components/QRLandingPage.tsx (sistema QR eliminado)
// - /components/QRScanner.tsx (sistema QR eliminado)
// - /components/Dashboard.tsx (reemplazado por TeacherDashboard)
// - /components/MenuManagement.tsx (funcionalidad incorporada en AdminDashboard)
// - /components/ScheduleView.tsx (funcionalidad incorporada en AdminDashboard)
// - /components/Sidebar.tsx (no se usa en el diseño móvil)
// - /components/StaffSchedule.tsx (funcionalidad incorporada en AdminDashboard)
// - /utils/cameraUtils.ts (sistema de cámara QR eliminado)
// - /utils/scheduleUtils.ts (lógica incorporada en database.ts)