import {
  BadgeDollarSign,
  Building,
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  LayoutDashboard,
  Package,
  Shield,
  ShoppingBag,
  ShoppingCart,
  User,
  Users,
} from "@icons";

export const CATALOG = [
  {
    category: "Procesos Contables y Financieros",
    items: [
      {
        name: "CONTPAQi Contabilidad",
        category: "Contabilidad",
        price: 4590,
        max_users: 15,
        description:
          "Sistema estándar en México para contadores. Automatiza el registro de pólizas a partir de los CFDI, genera estados financieros y cumple con toda la normativa de Contabilidad Electrónica del SAT.",
      },
      {
        name: "CONTPAQi Bancos",
        category: "Tesorería",
        price: 6390,
        max_users: 10,
        description:
          "Software para el control de tesorería. Gestiona ingresos, egresos, conciliaciones bancarias automáticas y el flujo de efectivo proyectado.",
      },
      {
        name: "CONTPAQi Contabiliza (Nube)",
        category: "Contabilidad",
        price: 4390,
        max_users: 25,
        description:
          "Versión 100% web de contabilidad. Permite trabajar desde cualquier lugar sin instalar servidores, con descarga automática de comprobantes desde el SAT.",
      },
      {
        name: "CONTPAQi Gastos",
        category: "Productividad",
        price: 0,
        max_users: 30,
        description:
          "Aplicación para que los empleados registren sus gastos de viaje o viáticos de forma digital. Facilita la comprobación y fiscalización de facturas.",
      },
    ],
  },
  {
    category: "Procesos Comerciales y Facturación",
    items: [
      {
        name: "CONTPAQi Comercial Premium",
        category: "Comercial",
        price: 10490,
        max_users: 30,
        description:
          "Software más robusto para empresas con almacenes. Controla inventarios multialmacén, procesos de compra, ventas, cuentas por cobrar y pagar.",
      },
      {
        name: "CONTPAQi Comercial Pro",
        category: "Comercial",
        price: 11290,
        max_users: 20,
        description:
          "Versión escalable para PyMEs con mayor profundidad en reportes y personalización de procesos comerciales.",
      },
      {
        name: "CONTPAQi Comercial Start",
        category: "Comercial",
        price: 2690,
        max_users: 5,
        description:
          "Para negocios que inician con procesos básicos de compra-venta e inventario.",
      },
      {
        name: "CONTPAQi Factura Electrónica",
        category: "Facturación",
        price: 2690,
        max_users: 10,
        description:
          "Ideal para prestadores de servicios. Emisión masiva de CFDI: facturas, notas de crédito, recibos de honorarios.",
      },
      {
        name: "CONTPAQi Vende (Nube)",
        category: "Facturación",
        price: 1690,
        max_users: 15,
        description:
          "Herramienta web para microempresas o emprendedores. Factura rápido desde navegador o celular y gestiona catálogos de clientes.",
      },
      {
        name: "CONTPAQi Punto de Venta",
        category: "Comercial",
        price: 2990,
        max_users: 12,
        description:
          "Especializado para tiendas con mostrador. Compatible con básculas, lectores de códigos de barras y cajones de dinero.",
      },
    ],
  },
  {
    category: "Nómina y Recursos Humanos",
    items: [
      {
        name: "CONTPAQi Nóminas",
        category: "Nómina",
        price: 5590,
        max_users: 20,
        description:
          "Cálculo de sueldos con timbrado masivo de CFDI de nómina, cálculos de IMSS, Infonavit, ISR, finiquitos y PTU.",
      },
      {
        name: "CONTPAQi Personia (Nube)",
        category: "Nómina",
        price: 3090,
        max_users: 30,
        description:
          "Versión en la nube para cálculo de nómina. Ideal para despachos o empresas pequeñas que necesitan movilidad.",
      },
      {
        name: "CONTPAQi Evalúa",
        category: "Recursos Humanos",
        price: 2190,
        max_users: 10,
        description:
          "Herramienta para cumplir con la NOM-035. Aplica encuestas de riesgo psicosocial y genera reportes automáticos.",
      },
    ],
  },
  {
    category: "Productividad e Infraestructura",
    items: [
      {
        name: "CONTPAQi XML en Línea+",
        category: "Productividad",
        price: 1790,
        max_users: 5,
        description:
          "Buscador y descargador masivo de facturas. Conecta con el SAT para bajar todos los XML emitidos y recibidos.",
      },
      {
        name: "CONTPAQi Respaldos",
        category: "Infraestructura",
        price: 1690,
        max_users: 1,
        description:
          "Servicio de almacenamiento en la nube con copias de seguridad automáticas de bases de datos. Protege contra fallas, robo y Ransomware.",
      },
      {
        name: "CONTPAQi Escritorio Virtual",
        category: "Infraestructura",
        price: 1690,
        max_users: 30,
        description:
          "Sube tus sistemas de escritorio a un servidor en la nube. Usa programas como Contabilidad o Nóminas desde cualquier computadora.",
      },
      {
        name: "CONTPAQi Optimiza",
        category: "Productividad",
        price: 1690,
        max_users: 15,
        description:
          "Tablero de gestión para despachos contables. Monitorea el avance de tareas, el estado de cumplimiento de clientes y el flujo de trabajo del equipo.",
      },
    ],
  },
];

export const PRODUCT_LOGO_MAP = {
  "CONTPAQi Contabilidad": FileSpreadsheet,
  "CONTPAQi Bancos": Building2,
  "CONTPAQi Contabiliza (Nube)": Globe,
  "CONTPAQi Gastos": BadgeDollarSign,
  "CONTPAQi Comercial Premium": ShoppingBag,
  "CONTPAQi Comercial Pro": ShoppingCart,
  "CONTPAQi Comercial Start": Package,
  "CONTPAQi Factura Electrónica": FileText,
  "CONTPAQi Vende (Nube)": ShoppingCart,
  "CONTPAQi Punto de Venta": Building,
  "CONTPAQi Nóminas": Users,
  "CONTPAQi Personia (Nube)": User,
  "CONTPAQi Evalúa": ClipboardList,
  "CONTPAQi XML en Línea+": Download,
  "CONTPAQi Respaldos": Shield,
  "CONTPAQi Escritorio Virtual": Building2,
  "CONTPAQi Optimiza": LayoutDashboard,
};
