import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ClientDetailView from "./client-detail/ClientDetailView";
import { useClientDetailController } from "./client-detail/useClientDetailController";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const controller = useClientDetailController({
    clientId: id,
    navigate,
    user,
  });

  return <ClientDetailView controller={controller} />;
}
