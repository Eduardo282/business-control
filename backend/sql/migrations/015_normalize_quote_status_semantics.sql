UPDATE quotes
SET status = CASE
  WHEN status IN ('ACEPTADA', 'RECHAZADA', 'SOLICITADA') THEN status
  WHEN is_registered = 1 AND is_sent_to_client_portal = 1 THEN 'ENVIADA'
  WHEN status = 'ENVIADA' THEN 'ENVIADA'
  ELSE 'PENDIENTE'
END;
