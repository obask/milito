import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { lazy } from 'solid-js'
import App from './App'
import './styles.css'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

// Lazy load route components
const Home = lazy(() => import('./routes/index'))
const Login = lazy(() => import('./routes/login'))
const Register = lazy(() => import('./routes/register'))
const Dashboard = lazy(() => import('./routes/dashboard'))
const Games = lazy(() => import('./routes/games'))
const Lobby = lazy(() => import('./routes/lobby'))

// Render app
render(
  () => (
    <QueryClientProvider client={queryClient}>
      <Router root={App}>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/games" component={Games} />
        <Route path="/lobby" component={Lobby} />
      </Router>
    </QueryClientProvider>
  ),
  document.getElementById('root')!
)
