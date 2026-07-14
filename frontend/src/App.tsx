import { AuthProvider } from "./features/auth/auth-context";
import { AppRoutes } from "./routes";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
