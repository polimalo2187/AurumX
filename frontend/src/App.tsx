import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AdminRoute } from "@/auth/AdminRoute";
import { AppLayout } from "@/layout/AppLayout";
import { AdminLayout } from "@/layout/AdminLayout";
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MachinesPage } from "@/pages/MachinesPage";
import { MyMachinesPage } from "@/pages/MyMachinesPage";
import { DepositPage } from "@/pages/DepositPage";
import { WalletPage } from "@/pages/WalletPage";
import { WithdrawalsPage } from "@/pages/WithdrawalsPage";
import { ReferralsPage } from "@/pages/ReferralsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminUserDetailPage } from "@/pages/admin/AdminUserDetailPage";
import { AdminDepositsPage } from "@/pages/admin/AdminDepositsPage";
import { AdminWithdrawalsPage } from "@/pages/admin/AdminWithdrawalsPage";
import { AdminRiskPage } from "@/pages/admin/AdminRiskPage";
import { AdminAuditPage } from "@/pages/admin/AdminAuditPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/my-machines" element={<MyMachinesPage />} />
          <Route path="/deposits" element={<DepositPage />} />
          <Route path="/deposits/new/:machinePlanId" element={<DepositPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/withdrawals" element={<WithdrawalsPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/deposits" element={<AdminDepositsPage />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="/admin/risk" element={<AdminRiskPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
