import { Routes, Route, Navigate } from "react-router-dom";
import { NostrAuthProvider } from "@/contexts/NostrAuthContext";
import { ROUTES } from "@/utils/routingWrapper";
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import FormPage from "./FormPage";
import OrdersPage from "./OrdersPage";
import VisualizationPage from "./VisualizationPage";
import AuthGuard from "@/components/AuthGuard";
import ExtensionCheck from "@/components/ExtensionCheck";

const Index = () => {
  return (
    <NostrAuthProvider>
      <ExtensionCheck>
        <div className="min-h-screen bg-[#F6F6F9]">
          <Routes>
            <Route path="/" element={<Navigate to={ROUTES.SIGNUP} replace />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/form" element={
              <AuthGuard>
                <FormPage />
              </AuthGuard>
            } />
            <Route path="/orders" element={
              <AuthGuard>
                <OrdersPage />
              </AuthGuard>
            } />
            <Route path="/visualization" element={
              <AuthGuard>
                <VisualizationPage />
              </AuthGuard>
            } />
          </Routes>
        </div>
      </ExtensionCheck>
    </NostrAuthProvider>
  );
};

export default Index;
