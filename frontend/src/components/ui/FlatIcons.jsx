const SvgIcon = ({
  children,
  size = 24,
  strokeWidth = 1.8,
  className = "",
  color = "currentColor",
  viewBox = "0 0 24 24",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...props}>
    {children}
  </svg>
);

const createIcon = (render, viewBox = "0 0 24 24") => {
  const Icon = ({
    size = 24,
    strokeWidth = 1.8,
    className = "",
    color = "currentColor",
    ...props
  }) => (
    <SvgIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      color={color}
      viewBox={viewBox}
      {...props}>
      {render()}
    </SvgIcon>
  );

  return Icon;
};

export const X = createIcon(() => (
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>
));

export const Plus = createIcon(() => (
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>
));

export const Minus = createIcon(() => <path d="M5 12h14" />);

export const Check = createIcon(() => <path d="m5 13 4 4L19 7" />);

export const ChevronLeft = createIcon(() => <path d="m15 18-6-6 6-6" />);
export const ChevronRight = createIcon(() => <path d="m9 18 6-6-6-6" />);
export const ChevronUp = createIcon(() => <path d="m18 15-6-6-6 6" />);
export const ChevronDown = createIcon(() => <path d="m6 9 6 6 6-6" />);

export const ChevronsLeft = createIcon(() => (
  <>
    <path d="m11 17-5-5 5-5" />
    <path d="m18 17-5-5 5-5" />
  </>
));

export const ChevronsRight = createIcon(() => (
  <>
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </>
));

export const ChevronsUpDown = createIcon(() => (
  <>
    <path d="m7 9 5-5 5 5" />
    <path d="m7 15 5 5 5-5" />
  </>
));

export const ArrowLeft = createIcon(() => (
  <>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </>
));

export const ArrowRight = createIcon(() => (
  <>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </>
));

export const Search = createIcon(() => (
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>
));

export const Filter = createIcon(() => (
  <>
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </>
));

export const SlidersHorizontal = createIcon(() => (
  <>
    <path d="M4 6h7" />
    <path d="M13 6h7" />
    <circle cx="12" cy="6" r="1.7" />
    <path d="M4 12h3" />
    <path d="M9 12h11" />
    <circle cx="8" cy="12" r="1.7" />
    <path d="M4 18h11" />
    <path d="M17 18h3" />
    <circle cx="16" cy="18" r="1.7" />
  </>
));

export const Trash2 = createIcon(() => (
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M7 7l1 12h8l1-12" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </>
));

export const AlertCircle = createIcon(() => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
  </>
));

export const AlertTriangle = createIcon(() => (
  <>
    <path d="M12 4 21 20H3L12 4z" />
    <path d="M12 9v5" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </>
));

export const CircleHelp = createIcon(() => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
    <circle cx="12" cy="16.7" r="0.6" fill="currentColor" stroke="none" />
  </>
));

export const Bell = createIcon(() => (
  <>
    <path d="M7 10a5 5 0 1 1 10 0v4l2 2H5l2-2v-4" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </>
));

export const Mail = createIcon(() => (
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </>
));

export const Phone = createIcon(() => (
  <>
    <path d="M6.5 4.5h3l1 4-2 1.5a13 13 0 0 0 5.5 5.5l1.5-2 4 1v3c0 1.1-.9 2-2 2A15.5 15.5 0 0 1 4.5 6.5c0-1.1.9-2 2-2z" />
  </>
));

export const Globe = createIcon(() => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18" />
    <path d="M12 3a14 14 0 0 0 0 18" />
  </>
));

export const MapPin = createIcon(() => (
  <>
    <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </>
));

export const Key = createIcon(() => (
  <>
    <circle cx="8" cy="12" r="3" />
    <path d="M11 12h9" />
    <path d="M17 12v2" />
    <path d="M20 12v2" />
  </>
));

export const Lock = createIcon(() => (
  <>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V8a4 4 0 0 1 8 0v2" />
  </>
));

export const Shield = createIcon(() => (
  <>
    <path d="M12 3 5 6v5c0 5 3.4 8.2 7 10 3.6-1.8 7-5 7-10V6l-7-3z" />
    <path d="m9 12 2 2 4-4" />
  </>
));

export const User = createIcon(() => (
  <>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 19a7 7 0 0 1 14 0" />
  </>
));

export const Users = createIcon(() => (
  <>
    <circle cx="9" cy="9" r="2.8" />
    <circle cx="16.5" cy="8" r="2.2" />
    <path d="M4 19a6 6 0 0 1 10 0" />
    <path d="M14 18a4.8 4.8 0 0 1 6 0" />
  </>
));

export const UserPlus = createIcon(() => (
  <>
    <circle cx="10" cy="8" r="3" />
    <path d="M4.5 19a6 6 0 0 1 11 0" />
    <path d="M18 8v6" />
    <path d="M15 11h6" />
  </>
));

export const Contact = createIcon(() => (
  <>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="M6.5 16a3.5 3.5 0 0 1 5 0" />
    <path d="M14 9h4" />
    <path d="M14 12h4" />
    <path d="M14 15h3" />
  </>
));

export const Tag = createIcon(() => (
  <>
    <path d="M3 12 12 3h7l2 2v7l-9 9L3 12z" />
    <circle cx="15.5" cy="8.5" r="1" />
  </>
));

export const Clipboard = createIcon(() => (
  <>
    <rect x="6" y="5" width="12" height="16" rx="2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
  </>
));

export const ClipboardList = createIcon(() => (
  <>
    <rect x="6" y="5" width="12" height="16" rx="2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 11h6" />
    <path d="M9 15h6" />
    <path d="M9 19h4" />
  </>
));

export const LayoutDashboard = createIcon(() => (
  <>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="5" rx="1" />
    <rect x="13" y="10" width="8" height="11" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
  </>
));

export const Construction = createIcon(() => (
  <>
    <path d="m4 20 7-7" />
    <path d="m13 5 6 6" />
    <path d="m12 6 2-2 6 6-2 2" />
    <path d="m3 14 7 7" />
  </>
));

export const Clock = createIcon(() => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6l4 2" />
  </>
));

export const History = createIcon(() => (
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 5v4h4" />
    <path d="M12 8v4l3 2" />
  </>
));

export const Download = createIcon(() => (
  <>
    <path d="M12 4v11" />
    <path d="m8 11 4 4 4-4" />
    <path d="M4 20h16" />
  </>
));

export const Upload = createIcon(() => (
  <>
    <path d="M12 20V9" />
    <path d="m8 13 4-4 4 4" />
    <path d="M4 4h16" />
  </>
));

export const ExternalLink = createIcon(() => (
  <>
    <path d="M14 5h5v5" />
    <path d="m10 14 9-9" />
    <path d="M19 14v5H5V5h5" />
  </>
));

export const Printer = createIcon(() => (
  <>
    <rect x="6" y="3" width="12" height="5" />
    <rect x="4" y="9" width="16" height="8" rx="2" />
    <rect x="7" y="14" width="10" height="7" />
  </>
));

export const Lightbulb = createIcon(() => (
  <>
    <path d="M12 3a6 6 0 0 1 4 10.5c-.8.8-1.3 1.8-1.5 2.9h-5c-.2-1.1-.7-2.1-1.5-2.9A6 6 0 0 1 12 3z" />
    <path d="M9 19h6" />
    <path d="M10 22h4" />
  </>
));

export const Sparkles = createIcon(() => (
  <>
    <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3z" />
    <path d="m18.5 13 0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8 0.8-2.2z" />
    <path d="m5.5 14 0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8 0.8-2.2z" />
  </>
));

export const Inbox = createIcon(() => (
  <>
    <path d="M4 5h16v11H15l-2 3-2-3H4V5z" />
  </>
));

export const Package = createIcon(() => (
  <>
    <path d="M3 7 12 3l9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </>
));

export const PackagePlus = createIcon(() => (
  <>
    <path d="M3 7 12 3l9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
    <path d="M18 10v4" />
    <path d="M16 12h4" />
  </>
));

export const PackageX = createIcon(() => (
  <>
    <path d="M3 7 12 3l9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
    <path d="m16.5 10.5 3 3" />
    <path d="m19.5 10.5-3 3" />
  </>
));

export const ShoppingBag = createIcon(() => (
  <>
    <path d="M6 8h12l-1 12H7L6 8z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </>
));

export const ShoppingCart = createIcon(() => (
  <>
    <circle cx="10" cy="19" r="1.5" />
    <circle cx="17" cy="19" r="1.5" />
    <path d="M3 4h2l2.2 10h10.8l1.8-7H7" />
  </>
));

export const BookOpen = createIcon(() => (
  <>
    <path d="M3 6a3 3 0 0 1 3-3h5v17H6a3 3 0 0 0-3 3" />
    <path d="M21 6a3 3 0 0 0-3-3h-5v17h5a3 3 0 0 1 3 3" />
  </>
));

export const Library = createIcon(() => (
  <>
    <path d="M4 20h16" />
    <path d="M6 6h3v12H6z" />
    <path d="M10.5 4h3v14h-3z" />
    <path d="M15 7h3v11h-3z" />
  </>
));

export const Building = createIcon(() => (
  <>
    <rect x="4" y="4" width="16" height="16" />
    <path d="M8 8h2" />
    <path d="M14 8h2" />
    <path d="M8 12h2" />
    <path d="M14 12h2" />
    <path d="M8 16h8" />
  </>
));

export const Building2 = createIcon(() => (
  <>
    <rect x="5" y="3" width="14" height="18" />
    <path d="M9 7h2" />
    <path d="M13 7h2" />
    <path d="M9 11h2" />
    <path d="M13 11h2" />
    <path d="M11 21v-4h2v4" />
  </>
));

export const FileText = createIcon(() => (
  <>
    <path d="M6 3h8l4 4v14H6V3z" />
    <path d="M14 3v4h4" />
    <path d="M8 12h8" />
    <path d="M8 16h8" />
  </>
));

export const FileCheck = createIcon(() => (
  <>
    <path d="M6 3h8l4 4v14H6V3z" />
    <path d="M14 3v4h4" />
    <path d="m9 14 2 2 4-4" />
  </>
));

export const FileSpreadsheet = createIcon(() => (
  <>
    <path d="M6 3h8l4 4v14H6V3z" />
    <path d="M14 3v4h4" />
    <path d="M8 12h8" />
    <path d="M8 16h8" />
    <path d="M10 10v8" />
    <path d="M14 10v8" />
  </>
));

export const FolderOpen = createIcon(() => (
  <>
    <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    <path d="M3 11h18" />
  </>
));

export const Pencil = createIcon(() => (
  <>
    <path d="m4 20 4.5-1 9-9-3.5-3.5-9 9L4 20z" />
    <path d="m13.5 6.5 3.5 3.5" />
  </>
));

export const Edit2 = Pencil;

export const ScrollText = createIcon(() => (
  <>
    <path d="M6 4h11a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" />
    <path d="M8 6h6" />
    <path d="M8 9h6" />
    <path d="M10 16h6" />
    <path d="M10 19h6" />
  </>
));

export const BadgeDollarSign = createIcon(() => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10" />
    <path d="M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1.1 1.5 3 1.8 3 .8 3 1.8-1.3 1.9-3 1.9-3-.9-3-1.9" />
  </>
));

export const CheckCircle = createIcon(() => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </>
));

export const CheckCircle2 = CheckCircle;

export const UploadCloud = Upload;

export const ShieldCheck = Shield;

export const Book = BookOpen;

export const DownloadCloud = Download;

export const MessageCircle = createIcon(() => (
  <>
    <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z" />
  </>
));

export const Send = createIcon(() => (
  <>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22 11 13 2 9z" />
  </>
));

export const Headphones = createIcon(() => (
  <>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
  </>
));

export const Star = createIcon(() => (
  <path d="M12 2l3.1 6.3L22 9.3l-5 4.8 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.8 6.9-1L12 2z" />
));

export const Smile = createIcon(() => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
  </>
));


export default {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Bell,
  BookOpen,
  Building,
  Building2,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  CircleHelp,
  Clipboard,
  ClipboardList,
  Clock,
  Construction,
  Contact,
  Download,
  Edit2,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  Globe,
  Headphones,
  History,
  Inbox,
  Key,
  LayoutDashboard,
  Library,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  PackagePlus,
  PackageX,
  Pencil,
  Phone,
  Plus,
  Printer,
  ScrollText,
  Search,
  Send,
  Shield,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
  X,
};
