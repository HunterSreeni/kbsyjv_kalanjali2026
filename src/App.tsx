import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PublicLayout } from './components/PublicLayout'
import { DashboardLayout } from './components/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/public/Landing'
import { Games } from './pages/public/Games'
import { Register } from './pages/public/Register'
import { Leaderboard } from './pages/public/Leaderboard'
import { Login } from './pages/public/Login'
import { AdminOverview } from './pages/admin/AdminOverview'
import { AdminRegistrations } from './pages/admin/AdminRegistrations'
import { AdminGames } from './pages/admin/AdminGames'
import { AdminJudges } from './pages/admin/AdminJudges'
import { AdminScores } from './pages/admin/AdminScores'
import { JudgeDashboard } from './pages/judge/JudgeDashboard'

const adminLinks = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/registrations', label: 'Registrations' },
  { to: '/admin/games', label: 'Games' },
  { to: '/admin/judges', label: 'Judges' },
  { to: '/admin/scores', label: 'Scores' },
]

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="games" element={<Games />} />
          <Route path="register" element={<Register />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="login" element={<Login />} />
        </Route>

        <Route
          path="admin"
          element={
            <ProtectedRoute role="admin">
              <DashboardLayout links={adminLinks} title="Kalanjali Admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="judges" element={<AdminJudges />} />
          <Route path="scores" element={<AdminScores />} />
        </Route>

        <Route
          path="judge"
          element={
            <ProtectedRoute role="judge">
              <DashboardLayout links={[]} title="Kalanjali Judge" />
            </ProtectedRoute>
          }
        >
          <Route index element={<JudgeDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
