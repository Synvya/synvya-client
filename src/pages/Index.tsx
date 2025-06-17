import { Routes, Route, Navigate } from "react-router-dom";
import { NostrAuthProvider } from "@/contexts/NostrAuthContext";
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import PaymentPage from "./PaymentPage";
import PaymentSuccess from "./PaymentSuccess";
import PaymentWebhook from "./PaymentWebhook";
import FormPage from "./FormPage";
import VisualizationPage from "./VisualizationPage";
import AuthGuard from "@/components/AuthGuard";
import ExtensionCheck from "@/components/ExtensionCheck";

const Index = () => {
  return (
    <NostrAuthProvider>
      <ExtensionCheck>
        <div className="min-h-screen bg-[#F6F6F9]">
          <Routes>
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/payment" element={
              <AuthGuard>
                <PaymentPage />
              </AuthGuard>
            } />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-webhook" element={<PaymentWebhook />} />
            <Route path="/form" element={
              <AuthGuard>
                <FormPage />
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
