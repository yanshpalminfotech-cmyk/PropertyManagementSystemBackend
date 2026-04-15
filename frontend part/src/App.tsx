import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
// import Dashboard from "./pages/Dashboard";
// import PropertyList from "./pages/properties/PropertyList";
// import PropertyForm from "./pages/properties/PropertyForm";
// import PropertyDetail from "./pages/properties/PropertyDetail";
// import MyVisits from "./pages/visits/MyVisits";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import AppLayout from "./components/AppLayout";
import { UserRole } from "./types/enums";
import PropertyForm from "./pages/properties/PropertyForm";
import PropertyList from "./pages/properties/PropertyList";
import Dashboard from "./pages/Dashboard";
import MyVisits from "./pages/visits/MyVisits";
import PropertyDetail from "./pages/properties/PropertyDetail";
import VisitManagement from "./pages/visits/VisitManagement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with layout */}
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route
            path="/properties/new"
            element={
              <RoleRoute role={[UserRole.ADMIN, UserRole.BROKER]}>
                <PropertyForm />
              </RoleRoute>
            }
          />
          <Route
            path="/properties/:id/edit"
            element={
              <RoleRoute role={[UserRole.ADMIN, UserRole.BROKER]}>
                <PropertyForm />
              </RoleRoute>
            }
          />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route
            path="/my-visits"
            element={
              <RoleRoute role={UserRole.CUSTOMER}>
                <MyVisits />
              </RoleRoute>
            }
          />
          <Route
            path="/visit-management"
            element={
              <RoleRoute role={[UserRole.ADMIN, UserRole.BROKER]}>
                <VisitManagement />
              </RoleRoute>
            }
          />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
