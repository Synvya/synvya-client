
import { Routes, Route, Navigate } from "react-router-dom";
import { NostrAuthProvider } from "@/contexts/NostrAuthContext";
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import FormPage from "./FormPage";
import DelegationPage from "./DelegationPage";
import VisualizationPage from "./VisualizationPage";
import AuthGuard from "@/components/AuthGuard";

const Index = () => {
  return (
    <NostrAuthProvider>
      <div className="min-h-screen bg-[#F6F6F9]">
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/form" element={
            <AuthGuard>
              <FormPage />
            </AuthGuard>
          } />
          <Route path="/delegation" element={
            <AuthGuard>
              <DelegationPage />
            </AuthGuard>
          } />
          <Route path="/visualization" element={
            <AuthGuard>
              <VisualizationPage />
            </AuthGuard>
          } />
        </Routes>
      </div>
    </NostrAuthProvider>
  );
};

export default Index;
