# Análisis de Rendimiento y Plan de Optimización

## 1. El Problema (Diagnóstico)

Después de correr un build de producción y analizar la aplicación, identificamos los siguientes cuellos de botella críticos que están destruyendo el rendimiento, especialmente en móviles:

1. **Polling Agresivo (El Asesino Silencioso)**: 
   - En `Topbar.jsx` hay un `setInterval` que hace un fetch a `getUnreadQuoteRequestsApi` **cada 2 segundos**. Esto mantiene el main thread ocupado, despierta el radio del celular constantemente drenando la batería, y causa re-renders continuos en la UI.
2. **Tamaño del Bundle (html2pdf)**:
   - Las dependencias para exportar PDFs (`html2pdf.js`, `jspdf`, `html2canvas`) son extremadamente pesadas (casi 1MB sin comprimir). Aunque se importan dinámicamente en `useQuotePdf.js`, Vite arroja un warning de límite de chunk de 500kB. No están mapeadas en `manualChunks` correctamente.

## 2. La Solución (Propuesta)

Vamos a aplicar las siguientes optimizaciones de alto impacto:

### [MODIFY] frontend/src/components/layout/Topbar.jsx
- Eliminar el polling de 2 segundos (`setInterval`).
- Dado que el proyecto ya tiene `socket.io-client` en sus dependencias, reemplazaremos el polling con una suscripción por WebSocket al servidor.
- *Nota temporal*: Si el backend aún no emite este evento específico por sockets, incrementaremos el fallback de polling de 2s a 60s para que la app respire, mientras el socket se reconecta o como fallback.

### [MODIFY] frontend/vite.config.js
- Configurar `manualChunks` para separar `html2pdf.js` y `html2canvas` en chunks explícitos, evitando que bloqueen o generen bundles masivos combinados.

## 3. Plan de Verificación

1. Revisar el profiler de React y la pestaña Network de Chrome: Confirmar que las peticiones `/api/quotes/unread` ya no ocurren cada 2 segundos.
2. Correr `pnpm build` nuevamente y verificar que el tamaño del chunk principal (`index-xxx.js`) no incluye librerías masivas de PDF.
3. Probar en dispositivo móvil emulado para asegurar que la latencia de UI bajó considerablemente.
