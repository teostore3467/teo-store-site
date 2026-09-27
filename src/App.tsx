import { Route, Routes } from 'react-router-dom'

import PublicFooter from './components/layout/PublicFooter'
import PublicHeader from './components/layout/PublicHeader'
import ScrollToTop from './components/layout/ScrollToTop'

import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import LoginPage from './features/auth/pages/LoginPage'
import ProfilePage from './features/auth/pages/ProfilePage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'

import AdminProtectedRoute from './features/admin/components/AdminProtectedRoute'
import AdminLayout from './features/admin/layout/AdminLayout'
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage'
import AdminEsimPage from './features/admin/pages/AdminEsimPage'
import AdminLoginPage from './features/admin/pages/AdminLoginPage'
import AdminOrdersPage from './features/admin/pages/AdminOrdersPage'
import AdminPaymentsPage from './features/admin/pages/AdminPaymentsPage'
import AdminPlansPage from './features/admin/pages/AdminPlansPage'
import AdminServiceEditPage from './features/admin/pages/AdminServiceEditPage'
import AdminServicesPage from './features/admin/pages/AdminServicesPage'
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage'
import AdminStoreReviewsPage from './features/admin/pages/AdminStoreReviewsPage'

import DigitalCheckoutPage from './features/digital-commerce/pages/DigitalCheckoutPage'
import DigitalOrderStatusPage from './features/digital-commerce/pages/DigitalOrderStatusPage'
import DigitalProductDetailsPage from './features/digital-commerce/pages/DigitalProductDetailsPage'
import DigitalStorePage from './features/digital-commerce/pages/DigitalStorePage'
import EsimCheckoutPage from './features/digital-commerce/pages/EsimCheckoutPage'
import EsimCountryPage from './features/digital-commerce/pages/EsimCountryPage'

import HomePage from './features/home/pages/HomePage'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />

      <Routes>
        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />

        <Route element={<AdminProtectedRoute />}>
          <Route
            path="/admin"
            element={<AdminLayout />}
          >
            <Route
              index
              element={<AdminDashboardPage />}
            />

            <Route
              path="services"
              element={<AdminServicesPage />}
            />

            <Route
              path="services/:serviceSlug"
              element={<AdminServiceEditPage />}
            />

            <Route
              path="plans"
              element={<AdminPlansPage />}
            />

            <Route
              path="esim"
              element={<AdminEsimPage />}
            />

            <Route
              path="orders"
              element={<AdminOrdersPage />}
            />

            <Route
              path="payments"
              element={<AdminPaymentsPage />}
            />

            <Route
              path="store-reviews"
              element={<AdminStoreReviewsPage />}
            />

            <Route
              path="settings"
              element={<AdminSettingsPage />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <>
              <PublicHeader />

              <Routes>
                <Route
                  path="/"
                  element={<HomePage />}
                />

                <Route
                  path="/profil"
                  element={<ProfilePage />}
                />

                <Route
                  path="/esim/:countrySlug/commande"
                  element={<EsimCheckoutPage />}
                />

                <Route
                  path="/services-numeriques"
                  element={<DigitalStorePage />}
                />

                <Route
                  path="/services-numeriques/:productSlug"
                  element={<DigitalProductDetailsPage />}
                />

                <Route
                  path="/services-numeriques/:productSlug/commande"
                  element={<DigitalCheckoutPage />}
                />

                <Route
                  path="/commande/:orderNumber"
                  element={<DigitalOrderStatusPage />}
                />

                <Route
                  path="/esim/:countrySlug"
                  element={<EsimCountryPage />}
                />

                <Route
                  path="/connexion"
                  element={<LoginPage />}
                />

                <Route
                  path="/inscription"
                  element={<RegisterPage />}
                />

                <Route
                  path="/mot-de-passe-oublie"
                  element={<ForgotPasswordPage />}
                />

                <Route
                  path="/reinitialiser-mot-de-passe"
                  element={<ResetPasswordPage />}
                />
              </Routes>

              <PublicFooter />
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App