import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Forbidden from "@/pages/Forbidden";
import QuejasDevolucionesPage from "@/pages/quejas-devoluciones/QuejasDevolucionesPage";
import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CopeLayout } from "@/layouts/CopeLayout";
import { ReportLayout } from "@/layouts/ReportLayout";
import ResumenEjecutivo from "@/pages/ResumenEjecutivo";
import Operacion from "@/pages/Operacion";
import Asesores from "@/pages/Asesores";
import CategoriasV2 from "@/pages/CategoriasV2";
import Clientes from "@/pages/Clientes";
import WhatsApp from "@/pages/WhatsApp";
import Zendesk from "@/pages/Zendesk";
import Tendencias from "@/pages/Tendencias";
import Pais from "@/pages/Pais";
import QuejasDevoluciones from "@/pages/QuejasDevoluciones";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import Atenciones from "@/pages/cope/Atenciones";
import ControlFacturacion from "@/pages/cope/ControlFacturacion";
import ClientesCope from "@/pages/cope/Clientes";
import { ConfigLayout } from "@/pages/config/ConfigLayout";
import ConfigDashboard from "@/pages/config/ConfigDashboard";
import UsuariosConfig from "@/pages/config/UsuariosConfig";
import RolesConfig from "@/pages/config/RolesConfig";
import EquiposConfig from "@/pages/config/EquiposConfig";
import FacturacionConfig from "@/pages/config/FacturacionConfig";
import QdConfig from "@/pages/config/QdConfig";
import IntegracionesConfig from "@/pages/config/IntegracionesConfig";
import ConfigPlaceholder from "@/pages/config/ConfigPlaceholder";
import Ayuda from "@/pages/cope/Ayuda";
import DesignSystem from "@/pages/cope/DesignSystem";
import GuiasResolucion from "@/pages/cope/GuiasResolucion";
import HerramientasAdmin from "@/pages/cope/HerramientasAdmin";
import ZendeskPage from "@/pages/zendesk/ZendeskPage";
import { GlobalAlertCenterPage } from "@/pages/global-alert-center/GlobalAlertCenterPage";
import { ElectronicBillingHealthPage } from "@/pages/electronic-billing-health/ElectronicBillingHealthPage";
import { QueueIntelligencePage } from "@/pages/queue-intelligence/QueueIntelligencePage";
import { ReleaseDeploymentPage } from "@/pages/release-deployment/ReleaseDeploymentPage";
import { IncidentCommandPage } from "@/pages/incident-command/IncidentCommandPage";
import { InfrastructureHealthPage } from "@/pages/operations-center/InfrastructureHealthPage";
import { CollaborationPage } from "@/pages/collaboration";
import { SupervisorPage } from "@/pages/supervisor/SupervisorPage";
import { LiveOperationsPage } from "@/pages/live-operations/LiveOperationsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/403", element: <Forbidden /> },
  {
    path: "/",
    element: <RequireAuthLayout />,
    children: [
      {
        path: "/",
        element: <CopeLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "atenciones", element: <Atenciones /> },
          { path: "control-facturacion", element: <ControlFacturacion /> },
          { path: "clientes", element: <ClientesCope /> },
          { path: "quejas-devoluciones", element: <ProtectedRoute modulo="Quejas y Devoluciones"><QuejasDevolucionesPage /></ProtectedRoute> },
          {
            path: "configuracion",
            element: <ProtectedRoute modulo="Configuración"><ConfigLayout /></ProtectedRoute>,
            children: [
              { index: true, element: <ConfigDashboard /> },
              { path: "preferencias", element: <ConfigPlaceholder section="preferencias" /> },
              { path: "usuarios", element: <UsuariosConfig /> },
              { path: "roles", element: <RolesConfig /> },
              { path: "equipos", element: <EquiposConfig /> },
              { path: "atencion", element: <ConfigPlaceholder section="atencion" /> },
              { path: "facturacion", element: <FacturacionConfig /> },
              { path: "quejas-devoluciones", element: <QdConfig /> },
              { path: "reporteria", element: <ConfigPlaceholder section="reporteria" /> },
              { path: "conocimiento", element: <ConfigPlaceholder section="conocimiento" /> },
              { path: "integraciones", element: <IntegracionesConfig /> },
              { path: "notificaciones", element: <ConfigPlaceholder section="notificaciones" /> },
              { path: "auditoria", element: <ConfigPlaceholder section="auditoria" /> },
            ],
          },
          { path: "zendesk", element: <ZendeskPage /> },
          { path: "ayuda", element: <Ayuda /> },
          { path: "design-system", element: <DesignSystem /> },
          { path: "admin/guias", element: <GuiasResolucion /> },
          { path: "admin/herramientas", element: <HerramientasAdmin /> },
          { path: "live-operations", element: <LiveOperationsPage /> },
          { path: "supervisor", element: <SupervisorPage /> },
          { path: "collaboration", element: <CollaborationPage /> },
          { path: "infrastructure", element: <InfrastructureHealthPage /> },
          { path: "incidents", element: <IncidentCommandPage /> },
          { path: "releases", element: <ReleaseDeploymentPage /> },
          { path: "queues", element: <QueueIntelligencePage /> },
          { path: "billing-health", element: <ElectronicBillingHealthPage /> },
          { path: "alerts", element: <GlobalAlertCenterPage /> },
          {
            path: "reportes",
            element: <ReportLayout />,
            children: [
              { index: true, element: <ResumenEjecutivo /> },
              { path: "operacion", element: <Operacion /> },
              { path: "asesores", element: <Asesores /> },
              { path: "categorias", element: <CategoriasV2 /> },
              { path: "clientes", element: <Clientes /> },
              { path: "pais", element: <Pais /> },
              { path: "whatsapp", element: <WhatsApp /> },
              { path: "zendesk", element: <Zendesk /> },
              { path: "tendencias", element: <Tendencias /> },
              { path: "quejas", element: <QuejasDevoluciones /> },
            ],
          },
        ],
      },
    ],
  },
]);
