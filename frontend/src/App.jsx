import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import AddExpense from './pages/AddExpense';
import ExpenseDetails from './pages/ExpenseDetails';
import SettleUp from './pages/SettleUp';
import Settings from './pages/Settings';
import Logout from './pages/Logout';
import CreateGroup from './pages/CreateGroup';
import Calculators from './pages/Calculators';
import RentCalculator from './pages/RentCalculator';
import TravelCalculator from './pages/TravelCalculator';
import InsuranceCalculator from './pages/InsuranceCalculator';
import FurnitureCalculator from './pages/FurnitureCalculator';
import GuestCalculator from './pages/GuestCalculator';
import Support from './pages/Support';
import Friends from './pages/Friends';
import Activity from './pages/Activity';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <GroupDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id/expense/new"
            element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/:id"
            element={
              <ProtectedRoute>
                <ExpenseDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id/settle"
            element={
              <ProtectedRoute>
                <SettleUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={<Navigate to="/settings" replace />}
          />
          <Route
            path="/groups/create"
            element={
              <ProtectedRoute>
                <CreateGroup />
              </ProtectedRoute>
            }
          />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/calculators/rent" element={<RentCalculator />} />
          <Route path="/calculators/travel" element={<TravelCalculator />} />
          <Route path="/calculators/insurance" element={<InsuranceCalculator />} />
          <Route path="/calculators/furniture" element={<FurnitureCalculator />} />
          <Route path="/calculators/guest" element={<GuestCalculator />} />
          <Route path="/support" element={<Support />} />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            }
          />
          <Route path="/logout" element={<Logout />} />

          {/* Redirect index or any other routes to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
