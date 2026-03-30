import AppRoutes from "./routes";  // 👈 THIS connects to src/routes.jsx

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />   {/* 👈 THIS USES YOUR routes.jsx */}
      </BrowserRouter>
    </AuthProvider>
  );
}