import { Helmet } from "react-helmet-async";
import AppRoutes from "./routes.jsx";

export default function App() {
  return (
    <>
      <Helmet
        defaultTitle="Business Control"
        titleTemplate="%s | Business Control"
      >
        <meta name="description" content="Sistema de gestión empresarial: cotizaciones, clientes, productos y pólizas." />
      </Helmet>
      <AppRoutes />
    </>
  );
}
