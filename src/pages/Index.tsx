import { Routes, Route, Navigate } from "react-router-dom";
import { NostrAuthProvider } from "@/contexts/NostrAuthContext";
import { ROUTES } from "@/utils/routingWrapper";
import SignInPage from "./SignInPage";
import SignUpPage from "./SignUpPage";
import PaymentPage from "./PaymentPage";
import PaymentSuccess from "./PaymentSuccess";
import PaymentWebhook from "./PaymentWebhook";
import FormPage from "./FormPage";
import OrdersPage from "./OrdersPage";
import VisualizationPage from "./VisualizationPage";
import SubscriptionAdmin from "./SubscriptionAdmin";
import AuthGuard from "@/components/AuthGuard";
import SubscriptionGuard from "@/components/SubscriptionGuard";
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
            <Route path="/payment" element={
              <AuthGuard>
                <PaymentPage />
              </AuthGuard>
            } />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-webhook" element={<PaymentWebhook />} />
            <Route path="/form" element={
              <SubscriptionGuard>
                <FormPage />
              </SubscriptionGuard>
            } />
            <Route path="/orders" element={
              <SubscriptionGuard>
                <OrdersPage />
              </SubscriptionGuard>
            } />
            <Route path="/visualization" element={
              <SubscriptionGuard>
                <VisualizationPage />
              </SubscriptionGuard>
            } />
            <Route path="/admin/subscriptions" element={<SubscriptionAdmin />} />
          </Routes>
        </div>
      </ExtensionCheck>
    </NostrAuthProvider>
  );
};

export default Index;
