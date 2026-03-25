import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BarChart3,
  Car,
  CheckCircle,
  ClipboardList,
  FileText,
  Heart,
  Info,
  LayoutDashboard,
  Menu,
  Package,
  PackageOpen,
  PackageSearch,
  Pencil,
  Phone,
  Pill,
  Plus,
  Printer,
  Scissors,
  Settings,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "./backend";
import type {
  DueRecord,
  MedicineRecord,
  PurchaseRecord,
  SaleRecord,
} from "./backend";
import { useActor } from "./hooks/useActor";

type Page =
  | "dashboard"
  | "medicines"
  | "due"
  | "dueledger"
  | "purchases"
  | "reports"
  | "income"
  | "expense"
  | "settings"
  | "about";

// Pharmacy info now dynamic (see getPharmacyInfo + state in App component)
interface PharmacySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
}
function getPharmacyInfo(): PharmacySettings {
  const stored = localStorage.getItem("pharmacySettings");
  if (stored) return JSON.parse(stored);
  return {
    name: "সাওম ফার্মেসি",
    address: "বালিগাঁও, লাখাই, হবিগঞ্জ",
    phone: "01XXXXXXXXX",
    email: "",
    logoUrl:
      "/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg",
  };
}

const VILLAGES: Record<string, string[]> = {
  বালিগাঁও: [
    "নয়াহাটি উত্তর পাড়া",
    "নয়াহাটি মধ্যপাড়া",
    "নয়াহাটি দক্ষিণপাড়া",
    "ইসলামপাড়া",
    "পূর্বহাটি",
    "মসজিদহাটি",
    "সোহাগপুর",
    "আগলা ভিটা",
    "মেম্বার হাটি",
    "জুজু মিয়ারহাটি",
    "পশ্চিমহাটি",
  ],
  ফরিদপুর: ["শান্তিপুর", "কাজলদিঘি", "পশ্চিমহাটি", "পূর্বহাটি", "মাইজহাটি", "আগলা হাটি"],
};

interface SupplierInfo {
  name: string;
  address: string;
  mobile: string;
}
function getSupplierDirectory(): Record<string, SupplierInfo> {
  return JSON.parse(localStorage.getItem("supplierDirectory") || "{}");
}
function saveSupplierToDirectory(info: SupplierInfo) {
  if (!info.name.trim()) return;
  const dir = getSupplierDirectory();
  dir[info.name.trim()] = info;
  localStorage.setItem("supplierDirectory", JSON.stringify(dir));
}

function getItemTypes(): string[] {
  const base = ["ট্যাবলেট", "ক্যাপসুল", "সিরাপ", "ইনজেকশন", "অন্যান্য"];
  const custom = JSON.parse(localStorage.getItem("customItemTypes") || "[]");
  return [...base, ...custom];
}

function formatDate(nano: bigint): string {
  if (!nano) return "—";
  return new Date(Number(nano) / 1_000_000).toLocaleDateString("bn-BD");
}

function formatDateForInput(nano: bigint): string {
  if (!nano) return "";
  const d = new Date(Number(nano) / 1_000_000);
  return d.toISOString().split("T")[0];
}

function dateStringToNano(dateStr: string): bigint {
  if (!dateStr) return BigInt(0);
  return BigInt(new Date(dateStr).getTime()) * BigInt(1_000_000);
}

function nowNano(): bigint {
  return BigInt(Date.now()) * BigInt(1_000_000);
}

function taka(amount: number): string {
  return `৳${amount.toLocaleString("bn-BD")}`;
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

const navItems: {
  id: Page;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "dashboard",
    label: "ড্যাশবোর্ড",
    icon: <LayoutDashboard size={18} />,
    color: "#4F8EF7",
  },
  {
    id: "medicines",
    label: "ওষুধ স্টক",
    icon: <Pill size={18} />,
    color: "#10B981",
  },
  {
    id: "purchases",
    label: "ক্রয়",
    icon: <PackageSearch size={18} />,
    color: "#F59E0B",
  },
  {
    id: "due",
    label: "বিক্রয়",
    icon: <ShoppingCart size={18} />,
    color: "#8B5CF6",
  },
  {
    id: "dueledger",
    label: "বকেয়া খাতা",
    icon: <ClipboardList size={18} />,
    color: "#EF4444",
  },
  {
    id: "income",
    label: "আয়",
    icon: <TrendingUp size={18} />,
    color: "#06B6D4",
  },
  {
    id: "expense",
    label: "ব্যয়",
    icon: <TrendingDown size={18} />,
    color: "#F97316",
  },
  {
    id: "reports",
    label: "রিপোর্ট",
    icon: <BarChart3 size={18} />,
    color: "#EC4899",
  },
  {
    id: "settings",
    label: "সেটিং",
    icon: <Settings size={18} />,
    color: "#A78BFA",
  },
  {
    id: "about",
    label: "আমাদের সম্পর্কে",
    icon: <Info size={18} />,
    color: "#34D399",
  },
];

function Sidebar({
  current,
  onChange,
  open,
  onClose,
  pharmacySettings,
}: {
  current: Page;
  onChange: (p: Page) => void;
  open: boolean;
  onClose: () => void;
  pharmacySettings: PharmacySettings;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
          onKeyDown={onClose}
          role="button"
          tabIndex={0}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-30 w-64 flex flex-col transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#0F3A3D" }}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <img
            src={pharmacySettings.logoUrl}
            alt="লোগো"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 mr-3"
          />
          <div>
            <div className="text-white font-bold text-lg leading-tight">
              {pharmacySettings.name}
            </div>
            <div className="text-white/60 text-xs mt-0.5">
              {pharmacySettings.address}
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden text-white/70 hover:text-white"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`nav.${item.id}.link`}
              onClick={() => {
                onChange(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${
                  current === item.id
                    ? "bg-white/15 shadow-sm"
                    : "hover:bg-white/8"
                }`}
              style={{ color: item.color }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-white/40 text-xs text-center">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="hover:text-white/60"
              target="_blank"
              rel="noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}

const INCOME_CATEGORIES = [
  "ঔষধ বিক্রি বাবদ টাকা",
  "ইনজেকশন পুশিং চার্জ",
  "ব্যান্ডেজ চার্জ",
  "শিলায় বাবদ চার্জ",
];
const EXPENSE_CATEGORIES = [
  "ঔষধ ক্রয় বাবদ টাকা",
  "ওষুধ আনতে গিয়ে গাড়ি ভাড়া",
  "লোডিং খরচ",
  "আনলোডিং খরচ",
];

// ─── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({
  medicines,
  sales,
  dueRecords,
  nearExpiry,
  lowStock,
}: {
  medicines: MedicineRecord[];
  sales: SaleRecord[];
  dueRecords: DueRecord[];
  nearExpiry: MedicineRecord[];
  lowStock: MedicineRecord[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNano = BigInt(today.getTime()) * BigInt(1_000_000);
  const tomorrowNano = todayNano + BigInt(86_400_000) * BigInt(1_000_000);

  const todaySales = sales
    .filter((s) => s.date >= todayNano && s.date < tomorrowNano)
    .reduce((sum, s) => sum + Number(s.totalPrice), 0);

  const totalDue = dueRecords
    .filter((d) => d.status === "Due")
    .reduce((sum, d) => sum + Number(d.totalPrice), 0);

  const recent5 = [...sales]
    .sort((a, b) => Number(b.date - a.date))
    .slice(0, 5);

  const kpiCards = [
    {
      label: "মোট ওষুধ",
      value: medicines.length,
      icon: <Pill size={22} />,
      color: "#1F6D63",
    },
    {
      label: "আজকের বিক্রয়",
      value: taka(todaySales),
      icon: <TrendingUp size={22} />,
      color: "#0F6E2E",
    },
    {
      label: "মোট বকেয়া",
      value: taka(totalDue),
      icon: <TrendingDown size={22} />,
      color: "#B45309",
    },
    {
      label: "মেয়াদ শেষের কাছাকাছি",
      value: nearExpiry.length,
      icon: <AlertTriangle size={22} />,
      color: "#DC2626",
    },
  ];

  // Income/Expense state for dashboard tabs
  const [incomeRecords, setIncomeRecords] = useState<
    Array<{
      id: string;
      date: string;
      amount: number;
      description: string;
      category?: string;
    }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("incomeRecords") || "[]");
    } catch {
      return [];
    }
  });
  const [expenseRecords, setExpenseRecords] = useState<
    Array<{
      id: string;
      date: string;
      amount: number;
      description: string;
      category?: string;
    }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("expenseRecords") || "[]");
    } catch {
      return [];
    }
  });

  const [incDate, setIncDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [incCat, setIncCat] = useState(INCOME_CATEGORIES[0]);
  const [incAmt, setIncAmt] = useState("");
  const [incDesc, setIncDesc] = useState("");

  const [expDate, setExpDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [expCat, setExpCat] = useState(EXPENSE_CATEGORIES[0]);
  const [expAmt, setExpAmt] = useState("");
  const [expDesc, setExpDesc] = useState("");

  function saveIncome() {
    if (!incAmt || Number(incAmt) <= 0) {
      toast.error("পরিমাণ দিন");
      return;
    }
    const newRec = {
      id: String(Date.now()),
      date: incDate,
      amount: Number(incAmt),
      description: incDesc.trim(),
      category: incCat,
    };
    const updated = [newRec, ...incomeRecords];
    setIncomeRecords(updated);
    localStorage.setItem("incomeRecords", JSON.stringify(updated));
    setIncAmt("");
    setIncDesc("");
    toast.success("আয় সংরক্ষণ হয়েছে");
  }

  function saveExpense() {
    if (!expAmt || Number(expAmt) <= 0) {
      toast.error("পরিমাণ দিন");
      return;
    }
    const newRec = {
      id: String(Date.now()),
      date: expDate,
      amount: Number(expAmt),
      description: expDesc.trim(),
      category: expCat,
    };
    const updated = [newRec, ...expenseRecords];
    setExpenseRecords(updated);
    localStorage.setItem("expenseRecords", JSON.stringify(updated));
    setExpAmt("");
    setExpDesc("");
    toast.success("ব্যয় সংরক্ষণ হয়েছে");
  }

  const totalIncome = incomeRecords.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenseRecords.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>

      <Tabs defaultValue="summary">
        <TabsList className="mb-4 bg-card shadow-card border border-border">
          <TabsTrigger
            value="summary"
            className="flex items-center gap-1.5 data-[state=active]:bg-blue-50"
            data-ocid="dashboard.summary.tab"
          >
            <LayoutDashboard size={15} style={{ color: "#4F8EF7" }} />
            <span
              style={{ color: "#4F8EF7" }}
              className="font-semibold text-sm"
            >
              সারসংক্ষেপ
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="income"
            className="flex items-center gap-1.5 data-[state=active]:bg-cyan-50"
            data-ocid="dashboard.income.tab"
          >
            <TrendingUp size={15} style={{ color: "#06B6D4" }} />
            <span
              style={{ color: "#06B6D4" }}
              className="font-semibold text-sm"
            >
              আয়
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="expense"
            className="flex items-center gap-1.5 data-[state=active]:bg-amber-50"
            data-ocid="dashboard.expense.tab"
          >
            <TrendingDown size={15} style={{ color: "#F59E0B" }} />
            <span
              style={{ color: "#F59E0B" }}
              className="font-semibold text-sm"
            >
              ব্যয়
            </span>
          </TabsTrigger>
        </TabsList>

        {/* সারসংক্ষেপ Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="bg-card rounded-lg p-4 shadow-card flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: card.color }}
                >
                  {card.icon}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{card.label}</p>
                  <p className="font-bold text-lg leading-tight">
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg shadow-card p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                <AlertTriangle size={16} /> কম স্টক সতর্কতা
              </h2>
              {lowStock.length === 0 ? (
                <p className="text-muted-foreground text-sm">কোনো সতর্কতা নেই।</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ওষুধ</TableHead>
                      <TableHead>স্টক</TableHead>
                      <TableHead>সর্বনিম্ন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStock.slice(0, 5).map((m) => (
                      <TableRow key={String(m.id)} className="bg-red-50">
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-destructive font-bold">
                          {String(m.quantity)} {getQtyUnitForMedicine(m.name)}
                        </TableCell>
                        <TableCell>{String(m.minStockAlert)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="bg-card rounded-lg shadow-card p-4">
              <h2 className="font-semibold mb-3">সাম্প্রতিক বিক্রয়</h2>
              {recent5.length === 0 ? (
                <p className="text-muted-foreground text-sm">কোনো বিক্রয় নেই।</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ওষুধ</TableHead>
                      <TableHead>পরিমাণ</TableHead>
                      <TableHead>মোট</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent5.map((s) => (
                      <TableRow key={String(s.id)}>
                        <TableCell>{s.medicineName}</TableCell>
                        <TableCell>{String(s.quantity)}</TableCell>
                        <TableCell>{taka(Number(s.totalPrice))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        {/* আয় Tab */}
        <TabsContent value="income" className="space-y-5">
          <div
            className="rounded-xl p-5 flex items-center gap-4 text-white"
            style={{ background: "linear-gradient(135deg, #06B6D4, #0891B2)" }}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp size={26} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">মোট আয়</p>
              <p className="text-3xl font-bold">{taka(totalIncome)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {INCOME_CATEGORIES.map((cat) => {
              const catTotal = incomeRecords
                .filter((r) => (r.category || INCOME_CATEGORIES[0]) === cat)
                .reduce((s, r) => s + r.amount, 0);
              return (
                <div
                  key={cat}
                  className="bg-card rounded-lg p-3 border-l-4 shadow-card"
                  style={{ borderLeftColor: "#06B6D4" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} style={{ color: "#06B6D4" }} />
                    <p className="text-xs text-muted-foreground leading-tight">
                      {cat}
                    </p>
                  </div>
                  <p
                    className="font-bold text-base"
                    style={{ color: "#06B6D4" }}
                  >
                    {taka(catTotal)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-card rounded-lg shadow-card p-4">
            <h2
              className="font-semibold mb-3 flex items-center gap-2"
              style={{ color: "#06B6D4" }}
            >
              <Plus size={16} /> নতুন আয় এন্ট্রি
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">তারিখ</Label>
                <Input
                  type="date"
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  data-ocid="dashboard.income.input"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">বিভাগ</Label>
                <select
                  value={incCat}
                  onChange={(e) => setIncCat(e.target.value)}
                  data-ocid="dashboard.income.select"
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {INCOME_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">পরিমাণ (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={incAmt}
                  onChange={(e) => setIncAmt(e.target.value)}
                  placeholder="যেমন: 5000"
                  data-ocid="dashboard.income.input"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">বিবরণ (ঐচ্ছিক)</Label>
                <Input
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="বিস্তারিত"
                  data-ocid="dashboard.income.input"
                  className="text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveIncome}
              data-ocid="dashboard.income.submit_button"
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-md text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#06B6D4" }}
            >
              <Plus size={15} /> সংরক্ষণ করুন
            </button>
          </div>

          <div className="bg-card rounded-lg shadow-card overflow-auto">
            <div
              className="px-4 pt-4 pb-2 font-semibold text-sm"
              style={{ color: "#06B6D4" }}
            >
              সাম্প্রতিক এন্ট্রি (সর্বশেষ ১০টি)
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>বিভাগ</TableHead>
                  <TableHead>বিবরণ</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-6"
                      data-ocid="dashboard.income.empty_state"
                    >
                      কোনো আয় এন্ট্রি নেই।
                    </TableCell>
                  </TableRow>
                )}
                {incomeRecords.slice(0, 10).map((r, i) => (
                  <TableRow
                    key={r.id}
                    data-ocid={`dashboard.income.item.${i + 1}`}
                  >
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell
                      className="text-sm font-medium"
                      style={{ color: "#06B6D4" }}
                    >
                      {r.category || INCOME_CATEGORIES[0]}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.description || "—"}
                    </TableCell>
                    <TableCell
                      className="font-semibold text-sm"
                      style={{ color: "#0891B2" }}
                    >
                      {taka(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ব্যয় Tab */}
        <TabsContent value="expense" className="space-y-5">
          <div
            className="rounded-xl p-5 flex items-center gap-4 text-white"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingDown size={26} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">মোট ব্যয়</p>
              <p className="text-3xl font-bold">{taka(totalExpense)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {EXPENSE_CATEGORIES.map((cat) => {
              const catTotal = expenseRecords
                .filter((r) => (r.category || EXPENSE_CATEGORIES[0]) === cat)
                .reduce((s, r) => s + r.amount, 0);
              return (
                <div
                  key={cat}
                  className="bg-card rounded-lg p-3 border-l-4 shadow-card"
                  style={{ borderLeftColor: "#F59E0B" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={14} style={{ color: "#F59E0B" }} />
                    <p className="text-xs text-muted-foreground leading-tight">
                      {cat}
                    </p>
                  </div>
                  <p
                    className="font-bold text-base"
                    style={{ color: "#D97706" }}
                  >
                    {taka(catTotal)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-card rounded-lg shadow-card p-4">
            <h2
              className="font-semibold mb-3 flex items-center gap-2"
              style={{ color: "#F59E0B" }}
            >
              <Plus size={16} /> নতুন ব্যয় এন্ট্রি
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">তারিখ</Label>
                <Input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  data-ocid="dashboard.expense.input"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">বিভাগ</Label>
                <select
                  value={expCat}
                  onChange={(e) => setExpCat(e.target.value)}
                  data-ocid="dashboard.expense.select"
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">পরিমাণ (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={expAmt}
                  onChange={(e) => setExpAmt(e.target.value)}
                  placeholder="যেমন: 2000"
                  data-ocid="dashboard.expense.input"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">বিবরণ (ঐচ্ছিক)</Label>
                <Input
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="বিস্তারিত"
                  data-ocid="dashboard.expense.input"
                  className="text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveExpense}
              data-ocid="dashboard.expense.submit_button"
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-md text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#F59E0B" }}
            >
              <Plus size={15} /> সংরক্ষণ করুন
            </button>
          </div>

          <div className="bg-card rounded-lg shadow-card overflow-auto">
            <div
              className="px-4 pt-4 pb-2 font-semibold text-sm"
              style={{ color: "#F59E0B" }}
            >
              সাম্প্রতিক এন্ট্রি (সর্বশেষ ১০টি)
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>বিভাগ</TableHead>
                  <TableHead>বিবরণ</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-6"
                      data-ocid="dashboard.expense.empty_state"
                    >
                      কোনো ব্যয় এন্ট্রি নেই।
                    </TableCell>
                  </TableRow>
                )}
                {expenseRecords.slice(0, 10).map((r, i) => (
                  <TableRow
                    key={r.id}
                    data-ocid={`dashboard.expense.item.${i + 1}`}
                  >
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell
                      className="text-sm font-medium"
                      style={{ color: "#D97706" }}
                    >
                      {r.category || EXPENSE_CATEGORIES[0]}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.description || "—"}
                    </TableCell>
                    <TableCell
                      className="font-semibold text-sm"
                      style={{ color: "#B45309" }}
                    >
                      {taka(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Medicine Stock ──────────────────────────────────────────────────────────

type MedicineForm = {
  name: string;
  baseName: string;
  strength: string;
  unit: string;
  brand: string;
  itemType: string;
  purchasePrice: string;
  sellingPrice: string;
  quantity: string;
  quantityUnit: string;
  minStockAlert: string;
  expiryDate: string;
};

const DEFAULT_STRENGTHS = [5, 10, 25, 50, 100, 125, 250, 500, 750, 1000];
const DEFAULT_UNITS = ["mg", "ml", "mcg", "g", "IU", "pieces"];

function getStrengths(): number[] {
  const custom = JSON.parse(localStorage.getItem("pharma_strengths") || "[]");
  const all = [
    ...DEFAULT_STRENGTHS,
    ...custom.filter((v: number) => !DEFAULT_STRENGTHS.includes(v)),
  ];
  return all.sort((a, b) => a - b);
}

function saveStrength(val: number) {
  const custom = JSON.parse(localStorage.getItem("pharma_strengths") || "[]");
  if (!custom.includes(val)) {
    localStorage.setItem("pharma_strengths", JSON.stringify([...custom, val]));
  }
}

function deleteStrength(val: number) {
  const custom = JSON.parse(localStorage.getItem("pharma_strengths") || "[]");
  localStorage.setItem(
    "pharma_strengths",
    JSON.stringify(custom.filter((v: number) => v !== val)),
  );
}

function editStrength(oldVal: number, newVal: number) {
  const custom = JSON.parse(localStorage.getItem("pharma_strengths") || "[]");
  const idx = custom.indexOf(oldVal);
  if (idx !== -1) {
    custom[idx] = newVal;
    localStorage.setItem("pharma_strengths", JSON.stringify(custom));
  }
}

function getUnits(): string[] {
  const custom = JSON.parse(localStorage.getItem("pharma_units") || "[]");
  const all = [
    ...DEFAULT_UNITS,
    ...custom.filter((v: string) => !DEFAULT_UNITS.includes(v)),
  ];
  return all;
}

function saveUnit(val: string) {
  const custom = JSON.parse(localStorage.getItem("pharma_units") || "[]");
  if (!custom.includes(val)) {
    localStorage.setItem("pharma_units", JSON.stringify([...custom, val]));
  }
}

function deleteUnit(val: string) {
  const custom = JSON.parse(localStorage.getItem("pharma_units") || "[]");
  localStorage.setItem(
    "pharma_units",
    JSON.stringify(custom.filter((v: string) => v !== val)),
  );
}

function editUnit(oldVal: string, newVal: string) {
  const custom = JSON.parse(localStorage.getItem("pharma_units") || "[]");
  const idx = custom.indexOf(oldVal);
  if (idx !== -1) {
    custom[idx] = newVal;
    localStorage.setItem("pharma_units", JSON.stringify(custom));
  }
}

// ─── Quantity Unit Helpers ────────────────────────────────────────────────────
const DEFAULT_QTY_UNITS = ["Piece", "Box", "Strip", "Bottle", "Pack"];

function getQtyUnits(): string[] {
  const custom = JSON.parse(
    localStorage.getItem("pharma_qty_units_list") || "[]",
  );
  return [
    ...DEFAULT_QTY_UNITS,
    ...custom.filter((u: string) => !DEFAULT_QTY_UNITS.includes(u)),
  ];
}

function saveQtyUnit(val: string) {
  const custom = JSON.parse(
    localStorage.getItem("pharma_qty_units_list") || "[]",
  );
  if (!custom.includes(val)) {
    localStorage.setItem(
      "pharma_qty_units_list",
      JSON.stringify([...custom, val]),
    );
  }
}

function deleteQtyUnit(val: string) {
  const custom = JSON.parse(
    localStorage.getItem("pharma_qty_units_list") || "[]",
  );
  localStorage.setItem(
    "pharma_qty_units_list",
    JSON.stringify(custom.filter((v: string) => v !== val)),
  );
}

function editQtyUnit(oldVal: string, newVal: string) {
  const custom = JSON.parse(
    localStorage.getItem("pharma_qty_units_list") || "[]",
  );
  const idx = custom.indexOf(oldVal);
  if (idx !== -1) {
    custom[idx] = newVal;
    localStorage.setItem("pharma_qty_units_list", JSON.stringify(custom));
  }
}

function getQtyUnitForMedicine(name: string): string {
  const map = JSON.parse(localStorage.getItem("pharma_med_qty_units") || "{}");
  return map[name] || "Piece";
}

function saveQtyUnitForMedicine(name: string, unit: string) {
  const map = JSON.parse(localStorage.getItem("pharma_med_qty_units") || "{}");
  map[name] = unit;
  localStorage.setItem("pharma_med_qty_units", JSON.stringify(map));
}

function getDueUnit(timestamp: bigint, medicineName: string): string {
  const unitMap = JSON.parse(localStorage.getItem("pharma_due_units") || "{}");
  return unitMap[`${String(timestamp)}_${medicineName}`] || "";
}

function buildMedicineName(
  baseName: string,
  strength: string,
  unit: string,
): string {
  const s = strength.trim();
  const u = unit.trim();
  const base = baseName.trim();
  if (!s && !u) return base;
  return `${base}${s ? ` ${s}` : ""}${u}`.trim();
}

function parseMedicineName(fullName: string): {
  baseName: string;
  strength: string;
  unit: string;
} {
  // Try to extract trailing "500mg", "250ml", etc.
  const match = fullName.match(
    /^(.*?)\s*(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|IU|pieces)?$/i,
  );
  if (match?.[2]) {
    return {
      baseName: match[1].trim(),
      strength: match[2],
      unit: match[3] ?? "",
    };
  }
  return { baseName: fullName, strength: "", unit: "" };
}

const emptyMedForm = (): MedicineForm => ({
  name: "",
  baseName: "",
  strength: "",
  unit: "mg",
  brand: "",
  itemType: "ট্যাবলেট",
  purchasePrice: "",
  sellingPrice: "",
  quantity: "",
  quantityUnit: "Piece",
  minStockAlert: "10",
  expiryDate: "",
});

// ─── Strength/Unit Fields Component ─────────────────────────────────────────

function StrengthUnitFields({
  strength,
  unit,
  onStrengthChange,
  onUnitChange,
}: {
  strength: string;
  unit: string;
  onStrengthChange: (v: string) => void;
  onUnitChange: (v: string) => void;
}) {
  const [strengths, setStrengths] = useState<number[]>(getStrengths());
  const [units, setUnits] = useState<string[]>(getUnits());
  const [showStrengthDropdown, setShowStrengthDropdown] = useState(false);
  const [editingStrength, setEditingStrength] = useState<number | null>(null);
  const [editStrengthVal, setEditStrengthVal] = useState("");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [newUnit, setNewUnit] = useState("");
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editUnitVal, setEditUnitVal] = useState("");

  function refreshStrengths() {
    setStrengths(getStrengths());
  }
  function refreshUnits() {
    setUnits(getUnits());
  }

  function handleAddStrength() {
    const v = Number(strength);
    if (v > 0 && !DEFAULT_STRENGTHS.includes(v)) {
      saveStrength(v);
      refreshStrengths();
    }
    setShowStrengthDropdown(false);
  }

  function handleDeleteStrength(val: number) {
    if (DEFAULT_STRENGTHS.includes(val)) return;
    deleteStrength(val);
    refreshStrengths();
  }

  function handleEditStrength(val: number) {
    setEditingStrength(val);
    setEditStrengthVal(String(val));
  }

  function handleSaveEditStrength(oldVal: number) {
    const newVal = Number(editStrengthVal);
    if (newVal > 0 && newVal !== oldVal) {
      editStrength(oldVal, newVal);
      if (strength === String(oldVal)) onStrengthChange(String(newVal));
      refreshStrengths();
    }
    setEditingStrength(null);
  }

  function handleAddUnit() {
    const v = newUnit.trim();
    if (v) {
      saveUnit(v);
      refreshUnits();
      onUnitChange(v);
      setNewUnit("");
    }
    setShowUnitDropdown(false);
  }

  function handleDeleteUnit(val: string) {
    if (DEFAULT_UNITS.includes(val)) return;
    deleteUnit(val);
    refreshUnits();
    if (unit === val) onUnitChange("mg");
  }

  function handleEditUnit(val: string) {
    setEditingUnit(val);
    setEditUnitVal(val);
  }

  function handleSaveEditUnit(oldVal: string) {
    const newVal = editUnitVal.trim();
    if (newVal && newVal !== oldVal) {
      editUnit(oldVal, newVal);
      if (unit === oldVal) onUnitChange(newVal);
      refreshUnits();
    }
    setEditingUnit(null);
  }

  return (
    <>
      <div className="col-span-2">
        <Label>Strength / Size</Label>
        <div className="flex gap-2 mt-1">
          {/* Strength input + dropdown - 60% width */}
          <div className="relative flex-[3]">
            <div className="flex gap-1">
              <Input
                type="number"
                min={0}
                value={strength}
                onChange={(e) => onStrengthChange(e.target.value)}
                placeholder="যেমন: 500"
                data-ocid="medicines.strength.input"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="px-2 shrink-0"
                onClick={() => setShowStrengthDropdown((v) => !v)}
                data-ocid="medicines.strength.toggle"
                title="Strength তালিকা"
              >
                ▾
              </Button>
              {strength &&
                Number(strength) > 0 &&
                !DEFAULT_STRENGTHS.includes(Number(strength)) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2 shrink-0 text-xs"
                    onClick={handleAddStrength}
                    data-ocid="medicines.strength.save_button"
                    title="তালিকায় সেভ করুন"
                  >
                    <Plus size={12} />
                  </Button>
                )}
            </div>
            {showStrengthDropdown && (
              <div className="absolute z-50 top-full left-0 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
                {strengths.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-muted group"
                  >
                    {editingStrength === s ? (
                      <>
                        <Input
                          type="number"
                          value={editStrengthVal}
                          onChange={(e) => setEditStrengthVal(e.target.value)}
                          className="h-6 text-xs flex-1"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 px-1 text-xs"
                          onClick={() => handleSaveEditStrength(s)}
                        >
                          ✓
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1 text-xs"
                          onClick={() => setEditingStrength(null)}
                        >
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="flex-1 text-sm text-left bg-transparent border-0 p-0"
                          onClick={() => {
                            onStrengthChange(String(s));
                            setShowStrengthDropdown(false);
                          }}
                        >
                          {s}
                        </button>
                        {!DEFAULT_STRENGTHS.includes(s) && (
                          <>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditStrength(s)}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteStrength(s)}
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unit dropdown - 40% width */}
          <div className="relative flex-[2]">
            <button
              type="button"
              className="flex items-center justify-between border border-input rounded-md px-3 h-9 cursor-pointer bg-background hover:bg-muted text-sm w-full"
              onClick={() => setShowUnitDropdown((v) => !v)}
              data-ocid="medicines.unit.select"
            >
              <span>{unit || "ইউনিট"}</span>
              <span className="text-muted-foreground text-xs">▾</span>
            </button>
            {showUnitDropdown && (
              <div className="absolute z-50 top-full right-0 mt-1 w-full min-w-[140px] bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
                {units.map((u) => (
                  <div
                    key={u}
                    className={`flex items-center gap-1 px-2 py-1.5 hover:bg-muted group cursor-pointer ${unit === u ? "bg-muted font-medium" : ""}`}
                  >
                    {editingUnit === u ? (
                      <>
                        <Input
                          value={editUnitVal}
                          onChange={(e) => setEditUnitVal(e.target.value)}
                          className="h-6 text-xs flex-1"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 px-1 text-xs"
                          onClick={() => handleSaveEditUnit(u)}
                        >
                          ✓
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1 text-xs"
                          onClick={() => setEditingUnit(null)}
                        >
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="flex-1 text-sm text-left bg-transparent border-0 p-0"
                          onClick={() => {
                            onUnitChange(u);
                            setShowUnitDropdown(false);
                          }}
                        >
                          {u}
                        </button>
                        {!DEFAULT_UNITS.includes(u) && (
                          <>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUnit(u);
                              }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnit(u);
                              }}
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div className="border-t border-border px-2 py-1.5">
                  <div className="flex gap-1">
                    <Input
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="নতুন ইউনিট"
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleAddUnit()}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={handleAddUnit}
                      data-ocid="medicines.unit.save_button"
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function QuantityUnitDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [units, setUnits] = useState<string[]>(getQtyUnits());
  const [newUnit, setNewUnit] = useState("");
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editUnitVal, setEditUnitVal] = useState("");

  function refresh() {
    setUnits(getQtyUnits());
  }

  function handleAdd() {
    const v = newUnit.trim();
    if (v && !DEFAULT_QTY_UNITS.includes(v)) {
      saveQtyUnit(v);
      refresh();
      onChange(v);
      setNewUnit("");
    } else if (v) {
      onChange(v);
      setNewUnit("");
    }
    setShow(false);
  }

  function handleDelete(val: string) {
    if (DEFAULT_QTY_UNITS.includes(val)) return;
    deleteQtyUnit(val);
    refresh();
    if (value === val) onChange("Piece");
  }

  function handleEdit(val: string) {
    setEditingUnit(val);
    setEditUnitVal(val);
  }

  function handleSaveEdit(oldVal: string) {
    const newVal = editUnitVal.trim();
    if (newVal && newVal !== oldVal) {
      editQtyUnit(oldVal, newVal);
      if (value === oldVal) onChange(newVal);
      refresh();
    }
    setEditingUnit(null);
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        className="flex items-center justify-between border border-input rounded-md px-3 h-9 cursor-pointer bg-background hover:bg-muted text-sm w-full"
        onClick={() => setShow((v) => !v)}
        data-ocid="medicines.qty_unit.select"
      >
        <span>{value || "Piece"}</span>
        <span className="text-muted-foreground text-xs">▾</span>
      </button>
      {show && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[140px] bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
          {units.map((u) => (
            <div
              key={u}
              className={`flex items-center gap-1 px-2 py-1.5 hover:bg-muted group cursor-pointer ${value === u ? "bg-muted font-medium" : ""}`}
            >
              {editingUnit === u ? (
                <>
                  <Input
                    value={editUnitVal}
                    onChange={(e) => setEditUnitVal(e.target.value)}
                    className="h-6 text-xs flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 px-1 text-xs"
                    onClick={() => handleSaveEdit(u)}
                  >
                    ✓
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1 text-xs"
                    onClick={() => setEditingUnit(null)}
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex-1 text-sm text-left bg-transparent border-0 p-0"
                    onClick={() => {
                      onChange(u);
                      setShow(false);
                    }}
                  >
                    {u}
                  </button>
                  {!DEFAULT_QTY_UNITS.includes(u) && (
                    <>
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(u);
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(u);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
          <div className="border-t border-border px-2 py-1.5">
            <div className="flex gap-1">
              <Input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="নতুন ইউনিট"
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={handleAdd}
                data-ocid="medicines.qty_unit.save_button"
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MedicinesPage({
  medicines,
  onRefresh,
  actor,
}: {
  medicines: MedicineRecord[];
  onRefresh: () => void;
  actor: backendInterface | null;
}) {
  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicineRecord | null>(null);
  const [form, setForm] = useState<MedicineForm>(emptyMedForm());
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  function openEdit(m: MedicineRecord) {
    setEditRecord(m);
    const parsed = parseMedicineName(m.name);
    setForm({
      name: m.name,
      baseName: parsed.baseName,
      strength: parsed.strength,
      unit: parsed.unit || "mg",
      brand: m.brand,
      itemType: m.itemType,
      purchasePrice: String(Number(m.purchasePrice)),
      sellingPrice: String(Number(m.sellingPrice)),
      quantity: String(Number(m.quantity)),
      quantityUnit: getQtyUnitForMedicine(m.name),
      minStockAlert: String(Number(m.minStockAlert)),
      expiryDate: formatDateForInput(m.expiryDate),
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.baseName.trim() && !form.name.trim()) {
      toast.error("ওষুধের নাম দিন");
      return;
    }
    setSaving(true);
    try {
      const record: MedicineRecord = {
        id: editRecord ? editRecord.id : BigInt(0),
        name:
          buildMedicineName(form.baseName, form.strength, form.unit) ||
          form.name.trim(),
        brand: form.brand.trim(),
        itemType: form.itemType,
        purchasePrice: BigInt(
          Math.round(Number.parseFloat(form.purchasePrice) || 0),
        ),
        sellingPrice: BigInt(
          Math.round(Number.parseFloat(form.sellingPrice) || 0),
        ),
        quantity: BigInt(Number.parseInt(form.quantity) || 0),
        minStockAlert: BigInt(Number.parseInt(form.minStockAlert) || 10),
        expiryDate: dateStringToNano(form.expiryDate),
        createdAt: editRecord ? editRecord.createdAt : nowNano(),
      };
      const medicineName =
        buildMedicineName(form.baseName, form.strength, form.unit) ||
        form.name.trim();
      saveQtyUnitForMedicine(medicineName, form.quantityUnit);
      if (editRecord) {
        await actor?.updateMedicine(editRecord.id, record);
        toast.success("ওষুধ আপডেট হয়েছে");
      } else {
        await actor?.addMedicine(record);
        toast.success("ওষুধ যোগ হয়েছে");
      }
      setOpen(false);
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await actor?.deleteMedicine(deleteId);
      toast.success("ওষুধ মুছে ফেলা হয়েছে");
      setDeleteId(null);
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ওষুধ স্টক</h1>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>নাম</TableHead>
              <TableHead>ব্র্যান্ড</TableHead>
              <TableHead>ধরন</TableHead>
              <TableHead>স্টক</TableHead>
              <TableHead>ক্রয়মূল্য</TableHead>
              <TableHead>বিক্রয়মূল্য</TableHead>
              <TableHead>মেয়াদ</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="medicines.empty_state"
                >
                  কোনো ওষুধ নেই। নতুন ওষুধ যোগ করুন।
                </TableCell>
              </TableRow>
            )}
            {medicines.map((m, i) => {
              const isLow = Number(m.quantity) <= Number(m.minStockAlert);
              return (
                <TableRow
                  key={String(m.id)}
                  className={isLow ? "bg-red-50" : ""}
                  data-ocid={`medicines.item.${i + 1}`}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.brand}</TableCell>
                  <TableCell>{m.itemType}</TableCell>
                  <TableCell>
                    <span className={isLow ? "text-destructive font-bold" : ""}>
                      {String(m.quantity)} {getQtyUnitForMedicine(m.name)}
                    </span>
                  </TableCell>
                  <TableCell>{taka(Number(m.purchasePrice))}</TableCell>
                  <TableCell>{taka(Number(m.sellingPrice))}</TableCell>
                  <TableCell>{formatDate(m.expiryDate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`medicines.edit_button.${i + 1}`}
                        onClick={() => openEdit(m)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-red-50"
                        data-ocid={`medicines.delete_button.${i + 1}`}
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-ocid="medicines.dialog">
          <DialogHeader>
            <DialogTitle>
              {editRecord ? "ওষুধ সম্পাদনা" : "নতুন ওষুধ যোগ"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>ওষুধের নাম *</Label>
              <Input
                data-ocid="medicines.input"
                value={form.baseName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, baseName: e.target.value }))
                }
                placeholder="যেমন: Napa, নাপা"
              />
            </div>
            <StrengthUnitFields
              strength={form.strength}
              unit={form.unit}
              onStrengthChange={(v) => setForm((p) => ({ ...p, strength: v }))}
              onUnitChange={(v) => setForm((p) => ({ ...p, unit: v }))}
            />
            {form.baseName.trim() && (
              <div className="col-span-2 text-sm text-muted-foreground bg-muted rounded px-3 py-1.5">
                <span className="font-medium">সম্পূর্ণ নাম:</span>{" "}
                <span className="font-semibold text-foreground">
                  {buildMedicineName(form.baseName, form.strength, form.unit)}
                </span>
              </div>
            )}
            <div>
              <Label>ব্র্যান্ড</Label>
              <Input
                value={form.brand}
                onChange={(e) =>
                  setForm((p) => ({ ...p, brand: e.target.value }))
                }
                placeholder="যেমন: Beximco"
              />
            </div>
            <div>
              <Label>ধরন</Label>
              <Select
                value={form.itemType}
                onValueChange={(v) => setForm((p) => ({ ...p, itemType: v }))}
              >
                <SelectTrigger data-ocid="medicines.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getItemTypes().map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ক্রয়মূল্য (৳)</Label>
              <Input
                type="number"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purchasePrice: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>বিক্রয়মূল্য (৳)</Label>
              <Input
                type="number"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sellingPrice: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <Label>পরিমাণ</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  className="flex-1"
                  value={form.quantity}
                  placeholder="যেমন: 100"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  data-ocid="medicines.quantity.input"
                />
                <div className="w-36">
                  <QuantityUnitDropdown
                    value={form.quantityUnit}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, quantityUnit: v }))
                    }
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>সর্বনিম্ন স্টক সতর্কতা</Label>
              <Input
                type="number"
                value={form.minStockAlert}
                onChange={(e) =>
                  setForm((p) => ({ ...p, minStockAlert: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <Label>মেয়াদ উত্তীর্ণ তারিখ</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, expiryDate: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="medicines.cancel_button"
            >
              বাতিল
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              data-ocid="medicines.save_button"
              style={{ backgroundColor: "#1F6D63" }}
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent data-ocid="medicines.delete_dialog">
          <DialogHeader>
            <DialogTitle>মুছে ফেলার নিশ্চিতকরণ</DialogTitle>
          </DialogHeader>
          <p>আপনি কি এই ওষুধটি মুছে ফেলতে চান?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="medicines.cancel_button"
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-ocid="medicines.confirm_button"
            >
              মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sales Page ──────────────────────────────────────────────────────────────

function SalesPage({
  medicines,
  sales,
  onRefresh,
  actor,
}: {
  medicines: MedicineRecord[];
  sales: SaleRecord[];
  onRefresh: () => void;
  actor: backendInterface | null;
}) {
  type MedRow = {
    rowId: string;
    medId: string;
    qty: string;
  };

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("বালিগাঁও");
  const [neighborhood, setNeighborhood] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"নগদ" | "বাকি">("নগদ");
  const [rows, setRows] = useState<MedRow[]>([
    { rowId: "1", medId: "", qty: "1" },
  ]);
  const [saving, setSaving] = useState(false);
  const [printSales, setPrintSales] = useState<SaleRecord[] | null>(null);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { rowId: String(Date.now()), medId: "", qty: "1" },
    ]);
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  }

  function updateRow(rowId: string, field: "medId" | "qty", value: string) {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)),
    );
  }

  const grandTotal = rows.reduce((sum, row) => {
    const med = medicines.find((m) => String(m.id) === row.medId);
    if (!med) return sum;
    return sum + Number(med.sellingPrice) * (Number.parseInt(row.qty) || 0);
  }, 0);

  async function handleSubmit() {
    const filledRows = rows.filter(
      (r) => r.medId && Number.parseInt(r.qty) > 0,
    );
    if (filledRows.length === 0) {
      toast.error("কমপক্ষে একটি ওষুধ যোগ করুন");
      return;
    }
    if (!customerName.trim() && paymentStatus === "বাকি") {
      toast.error("বাকি বিক্রয়ের জন্য কাস্টমারের নাম দিন");
      return;
    }
    for (const row of filledRows) {
      const med = medicines.find((m) => String(m.id) === row.medId);
      if (!med) continue;
      if (Number(med.quantity) < Number.parseInt(row.qty)) {
        toast.error(`${med.name}-এর পর্যাপ্ত স্টক নেই`);
        return;
      }
    }

    setSaving(true);
    const invoiceNumber = BigInt(Date.now());
    const createdSales: SaleRecord[] = [];

    try {
      for (const row of filledRows) {
        const med = medicines.find((m) => String(m.id) === row.medId);
        if (!med) continue;
        const qty = Number.parseInt(row.qty);
        const unitP = Number(med.sellingPrice);
        const total = unitP * qty;

        const saleRecord: SaleRecord = {
          id: BigInt(0),
          medicineId: med.id,
          medicineName: med.name,
          brand: med.brand,
          quantity: BigInt(qty),
          unitPrice: med.sellingPrice,
          totalPrice: BigInt(total),
          customerName: customerName.trim() || undefined,
          date: nowNano(),
          invoiceNumber,
          notes: paymentStatus === "বাকি" ? "বাকি" : undefined,
        };
        await actor?.createSale(saleRecord);
        createdSales.push(saleRecord);

        // Update stock
        await actor?.updateMedicine(med.id, {
          ...med,
          quantity: med.quantity - BigInt(qty),
        });

        if (paymentStatus === "বাকি") {
          const dueRecord: DueRecord = {
            id: BigInt(0),
            customerName: customerName.trim(),
            village,
            neighborhood,
            mobile: mobile.trim(),
            fatherName: fatherName.trim(),
            medicineId: med.id,
            medicineName: med.name,
            itemType: med.itemType || "ট্যাবলেট",
            quantity: BigInt(qty),
            unitPrice: med.sellingPrice,
            totalPrice: BigInt(total),
            status: "Due",
            date: nowNano(),
          };
          await actor?.addDueRecord(dueRecord);
          const cashPaidMap = JSON.parse(
            localStorage.getItem("pharma_customer_cashpaid") || "{}",
          );
          const custKey = `${customerName.trim()}|${village}|${neighborhood}`;
          cashPaidMap[custKey] = cashPaidMap[custKey] || 0;
          localStorage.setItem(
            "pharma_customer_cashpaid",
            JSON.stringify(cashPaidMap),
          );
        }

        if (paymentStatus === "নগদ") {
          const incomeRecords = JSON.parse(
            localStorage.getItem("incomeRecords") || "[]",
          );
          incomeRecords.push({
            id: Date.now().toString() + Math.random(),
            date: new Date().toISOString().split("T")[0],
            amount: total,
            description: `বিক্রয় - ${med.name} - Invoice#${String(invoiceNumber).slice(-6)}`,
          });
          localStorage.setItem("incomeRecords", JSON.stringify(incomeRecords));
        }
      }

      toast.success("বিক্রয় সম্পন্ন হয়েছে");
      setCustomerName("");
      setMobile("");
      setVillage("বালিগাঁও");
      setNeighborhood("");
      setFatherName("");
      setPaymentStatus("নগদ");
      setRows([{ rowId: "1", medId: "", qty: "1" }]);
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function handlePrint(sale: SaleRecord) {
    setPrintSales([sale]);
    setTimeout(() => window.print(), 300);
  }

  const sortedSales = [...sales].sort((a, b) => Number(b.date - a.date));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">বিক্রয়</h1>

      {/* Sale Form */}
      <div className="bg-card rounded-lg shadow-card p-5 space-y-5">
        <h2 className="font-semibold text-lg border-b pb-2">নতুন বিক্রয়</h2>

        {/* Customer Details */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            কাস্টমারের তথ্য
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>
                কাস্টমার নাম{" "}
                {paymentStatus === "বাকি" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Input
                data-ocid="sales.customer.input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="কাস্টমারের নাম লিখুন"
              />
            </div>
            <div>
              <Label>মোবাইল নম্বর</Label>
              <Input
                data-ocid="sales.mobile.input"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <Label>পিতার নাম</Label>
              <Input
                data-ocid="sales.father.input"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="পিতার নাম"
              />
            </div>
            <div>
              <Label>গ্রাম</Label>
              <Select
                value={village}
                onValueChange={(v) => {
                  setVillage(v);
                  setNeighborhood("");
                }}
              >
                <SelectTrigger data-ocid="sales.village.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(VILLAGES).map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>পাড়া</Label>
              <Select value={neighborhood} onValueChange={setNeighborhood}>
                <SelectTrigger data-ocid="sales.neighborhood.select">
                  <SelectValue placeholder="পাড়া বেছে নিন" />
                </SelectTrigger>
                <SelectContent>
                  {(VILLAGES[village] || []).map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Medicine Rows */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            ওষুধের তালিকা
          </h3>
          <div className="space-y-2">
            {rows.map((row, i) => {
              const med = medicines.find((m) => String(m.id) === row.medId);
              const rowTotal = med
                ? Number(med.sellingPrice) * (Number.parseInt(row.qty) || 0)
                : 0;
              return (
                <div
                  key={row.rowId}
                  data-ocid={`sales.item.${i + 1}`}
                  className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 rounded-lg"
                >
                  {/* Medicine select — 5 cols */}
                  <div className="col-span-12 sm:col-span-5">
                    {i === 0 && <Label className="text-xs">ওষুধ</Label>}
                    <Select
                      value={row.medId}
                      onValueChange={(v) => updateRow(row.rowId, "medId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ওষুধ বেছে নিন" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((m) => (
                          <SelectItem key={String(m.id)} value={String(m.id)}>
                            {m.name} ({m.brand}) — স্টক: {String(m.quantity)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Qty — 2 cols */}
                  <div className="col-span-4 sm:col-span-2">
                    {i === 0 && <Label className="text-xs">পরিমাণ</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={row.qty}
                      onChange={(e) =>
                        updateRow(row.rowId, "qty", e.target.value)
                      }
                    />
                  </div>
                  {/* Unit — 2 cols */}
                  <div className="col-span-4 sm:col-span-2">
                    {i === 0 && <Label className="text-xs">ইউনিট</Label>}
                    <Input readOnly value={"—"} className="bg-muted text-sm" />
                  </div>
                  {/* Unit price — 2 cols */}
                  <div className="col-span-4 sm:col-span-2">
                    {i === 0 && <Label className="text-xs">একক মূল্য</Label>}
                    <Input
                      readOnly
                      value={med ? taka(Number(med.sellingPrice)) : "—"}
                      className="bg-muted text-sm"
                    />
                  </div>
                  {/* Row total — 2 cols */}
                  <div className="col-span-5 sm:col-span-2 relative">
                    {i === 0 && <Label className="text-xs">মোট</Label>}
                    <Input
                      readOnly
                      value={med ? taka(rowTotal) : "—"}
                      className="bg-muted font-semibold text-sm"
                    />
                  </div>
                  {/* Remove — 1 col */}
                  <div className="col-span-1 flex justify-end">
                    {rows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 h-9 w-9"
                        onClick={() => removeRow(row.rowId)}
                        data-ocid={`sales.delete_button.${i + 1}`}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              data-ocid="sales.secondary_button"
            >
              + ওষুধ যোগ করুন
            </Button>
            <div className="text-lg font-bold">
              মোট: <span style={{ color: "#1F6D63" }}>{taka(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            পেমেন্ট ধরন
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPaymentStatus("নগদ")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${paymentStatus === "নগদ" ? "bg-green-600 text-white border-green-600" : "border-border hover:bg-muted"}`}
              data-ocid="sales.cash.toggle"
            >
              ✓ নগদ
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus("বাকি")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${paymentStatus === "বাকি" ? "bg-red-600 text-white border-red-600" : "border-border hover:bg-muted"}`}
              data-ocid="sales.due.toggle"
            >
              ⚠ বাকি
            </button>
          </div>
          {paymentStatus === "বাকি" && (
            <p className="text-xs text-red-600 mt-1">
              বাকি বিক্রয় স্বয়ংক্রিয়ভাবে বকেয়া খাতায় যুক্ত হবে।
            </p>
          )}
          {paymentStatus === "নগদ" && (
            <p className="text-xs text-green-600 mt-1">
              নগদ বিক্রয় স্বয়ংক্রিয়ভাবে আয় খাতায় যুক্ত হবে।
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            data-ocid="sales.submit_button"
            onClick={handleSubmit}
            disabled={saving}
            style={{ backgroundColor: "#1F6D63" }}
            className="px-8"
          >
            {saving ? "সংরক্ষণ হচ্ছে..." : "বিক্রয় নিশ্চিত করুন"}
          </Button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold">বিক্রয় ইতিহাস</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>কাস্টমার</TableHead>
              <TableHead>ওষুধ</TableHead>
              <TableHead>পরিমাণ</TableHead>
              <TableHead>মোট</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead>প্রিন্ট</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSales.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="sales.empty_state"
                >
                  কোনো বিক্রয় নেই।
                </TableCell>
              </TableRow>
            )}
            {sortedSales.map((s, i) => (
              <TableRow key={String(s.id)} data-ocid={`sales.row.${i + 1}`}>
                <TableCell className="font-mono text-xs">
                  {String(s.invoiceNumber).slice(-6)}
                </TableCell>
                <TableCell>{s.customerName || "—"}</TableCell>
                <TableCell>{s.medicineName}</TableCell>
                <TableCell>{String(s.quantity)}</TableCell>
                <TableCell className="font-semibold">
                  {taka(Number(s.totalPrice))}
                </TableCell>
                <TableCell>
                  {s.notes === "বাকি" ? (
                    <Badge variant="destructive" className="text-xs">
                      বাকি
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="text-xs bg-green-600 hover:bg-green-700"
                    >
                      নগদ
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatDate(s.date)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint(s)}
                    data-ocid={`sales.print_button.${i + 1}`}
                  >
                    <Printer size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Print Invoice */}
      {printSales && printSales.length > 0 && (
        <div className="hidden print:block print-area">
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #0F3A3D",
              paddingBottom: 12,
              marginBottom: 12,
            }}
          >
            <img
              src="/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg"
              alt="লোগো"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 8px",
              }}
            />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F3A3D" }}>
              {getPharmacyInfo().name}
            </h1>
            <p style={{ fontSize: 13 }}>{getPharmacyInfo().address}</p>
            <p style={{ fontSize: 13 }}>ফোন: {getPharmacyInfo().phone}</p>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            ইনভয়েস
          </h2>
          <p>তারিখ: {formatDate(printSales[0].date)}</p>
          <p>ইনভয়েস নং: {String(printSales[0].invoiceNumber)}</p>
          {printSales[0].customerName && (
            <p>কাস্টমার: {printSales[0].customerName}</p>
          )}
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc" }}>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>ওষুধ</th>
                <th style={{ textAlign: "right", padding: "4px 8px" }}>
                  পরিমাণ
                </th>
                <th style={{ textAlign: "right", padding: "4px 8px" }}>
                  একক মূল্য
                </th>
                <th style={{ textAlign: "right", padding: "4px 8px" }}>মোট</th>
                <th style={{ textAlign: "right", padding: "4px 8px" }}>
                  স্ট্যাটাস
                </th>
              </tr>
            </thead>
            <tbody>
              {printSales.map((ps, idx) => (
                <tr
                  key={`${ps.medicineName}-${idx}`}
                  style={{ borderBottom: "1px solid #eee" }}
                >
                  <td style={{ padding: "4px 8px" }}>{ps.medicineName}</td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>
                    {String(ps.quantity)}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>
                    {taka(Number(ps.unitPrice))}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>
                    {taka(Number(ps.totalPrice))}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>
                    {ps.notes === "বাকি" ? "বাকি" : "নগদ"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              marginTop: 12,
              borderTop: "1px solid #ccc",
              paddingTop: 8,
              textAlign: "right",
            }}
          >
            <strong>
              মোট:{" "}
              {taka(printSales.reduce((s, p) => s + Number(p.totalPrice), 0))}
            </strong>
          </div>
          <p
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 11,
              color: "#888",
            }}
          >
            ধন্যবাদ আপনাকে!
          </p>
        </div>
      )}
      <ExtraServiceChargesSection />
    </div>
  );
}

function ExtraServiceChargesSection() {
  type ChargeEntry = {
    id: string;
    patientName?: string;
    amount: number;
    date: string;
  };

  const chargeTypes = [
    {
      key: "pharma_extra_charge_injection",
      label: "ইনজেকশন পুশিং চার্জ",
      color: "#059669",
      Icon: Zap,
      ocidPrefix: "injection_charge",
    },
    {
      key: "pharma_extra_charge_bandage",
      label: "ব্যান্ডেজ চার্জ",
      color: "#E11D48",
      Icon: Heart,
      ocidPrefix: "bandage_charge",
    },
    {
      key: "pharma_extra_charge_suture",
      label: "সেলাই চার্জ",
      color: "#7C3AED",
      Icon: Scissors,
      ocidPrefix: "suture_charge",
    },
  ] as const;

  const today = new Date().toISOString().split("T")[0];

  function loadEntries(key: string): ChargeEntry[] {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function saveEntries(key: string, entries: ChargeEntry[]) {
    try {
      localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }

  const [states, setStates] = useState(() =>
    chargeTypes.map((ct) => ({
      patientName: "",
      amount: "",
      date: today,
      entries: loadEntries(ct.key),
    })),
  );

  function update(idx: number, field: string, value: string) {
    setStates((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  }

  function saveEntry(idx: number) {
    const ct = chargeTypes[idx];
    const s = states[idx];
    const amt = Number.parseFloat(s.amount);
    if (!amt || amt <= 0) {
      toast.error("সঠিক টাকার পরিমাণ দিন");
      return;
    }
    const newEntry: ChargeEntry = {
      id: String(Date.now()),
      patientName: s.patientName.trim() || undefined,
      amount: amt,
      date: s.date,
    };
    const updated = [newEntry, ...loadEntries(ct.key)];
    saveEntries(ct.key, updated);
    setStates((prev) =>
      prev.map((st, i) =>
        i === idx
          ? { ...st, amount: "", patientName: "", entries: updated }
          : st,
      ),
    );
    toast.success(`${ct.label} সংরক্ষিত হয়েছে`);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-1 h-6 rounded-full"
          style={{
            background: "linear-gradient(to bottom, #059669, #E11D48, #7C3AED)",
          }}
        />
        <h2 className="text-lg font-bold text-foreground">অতিরিক্ত সেবা চার্জ</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {chargeTypes.map((ct, idx) => {
          const s = states[idx];
          const Icon = ct.Icon;
          return (
            <div
              key={ct.key}
              className="rounded-xl border-2 bg-card p-4 shadow-sm"
              style={{ borderColor: `${ct.color}33` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: `${ct.color}18` }}
                >
                  <Icon size={18} style={{ color: ct.color }} />
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{ color: ct.color }}
                >
                  {ct.label}
                </span>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="রোগীর নাম (ঐচ্ছিক)"
                  value={s.patientName}
                  onChange={(e) => update(idx, "patientName", e.target.value)}
                  className="text-sm"
                  data-ocid={`${ct.ocidPrefix}.input`}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="টাকা"
                    value={s.amount}
                    onChange={(e) => update(idx, "amount", e.target.value)}
                    className="text-sm"
                    data-ocid={`${ct.ocidPrefix}.amount.input`}
                  />
                  <Input
                    type="date"
                    value={s.date}
                    onChange={(e) => update(idx, "date", e.target.value)}
                    className="text-sm"
                    data-ocid={`${ct.ocidPrefix}.date.input`}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full text-white font-semibold"
                  style={{ background: ct.color }}
                  onClick={() => saveEntry(idx)}
                  data-ocid={`${ct.ocidPrefix}.save_button`}
                >
                  সংরক্ষণ করুন
                </Button>
              </div>
              {s.entries.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    সাম্প্রতিক এন্ট্রি:
                  </p>
                  {s.entries.slice(0, 5).map((e, ei) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                      style={{ background: `${ct.color}0D` }}
                      data-ocid={`${ct.ocidPrefix}.item.${ei + 1}`}
                    >
                      <span className="text-muted-foreground">
                        {e.patientName || e.date}
                      </span>
                      <span className="font-bold" style={{ color: ct.color }}>
                        ৳{e.amount.toLocaleString("bn-BD")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Purchases Page ──────────────────────────────────────────────────────────

const GENERIC_TO_BRANDS: Record<string, string[]> = {
  paracetamol: [
    "নাপা",
    "নাপা এক্সট্রা",
    "নাপা এক্সটেন্ড",
    "এইস / ACE",
    "Fast",
    "Pyrex",
    "Reset",
    "প্যারাসিটামল ট্যাবলেট",
    "Max Para",
    "Para",
    "Fevex",
    "Tylenol",
  ],
  প্যারাসিটামল: [
    "নাপা",
    "নাপা এক্সট্রা",
    "নাপা এক্সটেন্ড",
    "এইস / ACE",
    "Fast",
    "Pyrex",
    "Reset",
    "প্যারাসিটামল ট্যাবলেট",
    "Max Para",
    "Para",
    "Fevex",
  ],
  amoxicillin: [
    "Moxacil",
    "Amoxil",
    "Bactamox",
    "Amoxicap",
    "Moxilen",
    "Amoclan",
    "Tycil",
  ],
  অ্যামক্সিসিলিন: [
    "Moxacil",
    "Amoxil",
    "Bactamox",
    "Amoxicap",
    "Moxilen",
    "Tycil",
  ],
  metronidazole: ["Amodis", "Flagyl", "Metryl", "Filmet", "Trichozole"],
  মেট্রোনিডাজল: ["Amodis", "Flagyl", "Metryl", "Filmet"],
  omeprazole: ["Losectil", "Omez", "Omidon", "Omeprol", "Neoprazol", "Opton"],
  ওমেপ্রাজল: ["Losectil", "Omez", "Omidon", "Omeprol"],
  cetirizine: ["Alatrol", "Cetizin", "Histalex", "Riz", "Ceticad", "Alercet"],
  সেটিরিজিন: ["Alatrol", "Cetizin", "Histalex", "Riz"],
  azithromycin: [
    "Zithromax",
    "Zimax",
    "Azit",
    "Azithrox",
    "Azimac",
    "Zetro",
    "Atm",
  ],
  অ্যাজিথ্রোমাইসিন: ["Zimax", "Azit", "Azithrox"],
  ciprofloxacin: [
    "Ciprocin",
    "Cipro",
    "Ciproflox",
    "Cipro-A",
    "Ciplox",
    "Neofloxin",
  ],
  সিপ্রোফ্লক্সাসিন: ["Ciprocin", "Cipro", "Ciproflox"],
  diclofenac: ["Voveran", "Diclofen", "Divon", "Cataflam", "Dicsol", "Dolo"],
  ডাইক্লোফেনাক: ["Voveran", "Diclofen", "Divon"],
  ranitidine: ["Neotak", "Ranison", "Radin", "Rantac", "Gastrol"],
  র‍্যানিটিডিন: ["Neotak", "Ranison", "Radin"],
  salbutamol: ["Ventolin", "Salmol", "Salbuvent", "Asmalin", "Sultolin"],
  সালবিউটামল: ["Ventolin", "Salmol", "Salbuvent"],
  amlodipine: ["Amdocal", "Amlocard", "Amlodin", "Amtas", "Norvasc", "Amlovas"],
  অ্যামলোডিপিন: ["Amdocal", "Amlocard", "Amlodin"],
  metformin: ["Glucomin", "Formet", "Metformi", "Formit", "Metfor", "Diabecon"],
  মেটফরমিন: ["Glucomin", "Formet", "Metformi"],
  atorvastatin: ["Atova", "Lipitor", "Atorin", "Atrovas", "Lipostat"],
  অ্যাটোরভাস্ট্যাটিন: ["Atova", "Lipitor", "Atorin"],
  fluconazole: ["Flucoral", "Fluzole", "Flucon", "Flucos", "Diflu"],
  ফ্লুকোনাজল: ["Flucoral", "Fluzole", "Flucon"],
  clotrimazole: ["Candid", "Clotrin", "Myco-F", "Fungidal"],
  ক্লোট্রিমাজল: ["Candid", "Clotrin"],
  cefuroxime: ["Zinnat", "Cef-3", "Cefim", "Cefurox", "Xorimax"],
  সেফুরোক্সিম: ["Zinnat", "Cef-3", "Cefim"],
  pantoprazole: ["Pantop", "Pantonix", "Panto", "Pantocid", "Pantosec"],
  প্যান্টোপ্রাজল: ["Pantop", "Pantonix", "Panto"],
  levofloxacin: ["Lebact", "Levoflox", "Levotas", "Tavanic", "Lefox"],
  লেভোফ্লক্সাসিন: ["Lebact", "Levoflox", "Levotas"],
  ibuprofen: ["Brufen", "Ibufen", "Ibugesic", "Nurofen", "Profen", "Advil"],
  আইবুপ্রোফেন: ["Brufen", "Ibufen", "Ibugesic"],
  fexofenadine: ["Fexo", "Telfast", "Fexodine", "Allegra", "Fexofed"],
  ফেক্সোফেনাডিন: ["Fexo", "Telfast", "Allegra"],
  montelukast: ["Singulair", "Montair", "Montexa", "Montek"],
  মন্টেলুকাস্ট: ["Singulair", "Montair", "Montexa"],
};

const BRAND_TO_COMPANY: Record<string, string> = {
  // Paracetamol brands
  নাপা: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  "নাপা এক্সট্রা": "বেক্সিমকো ফার্মাসিউটিক্যালস",
  "নাপা এক্সটেন্ড": "বেক্সিমকো ফার্মাসিউটিক্যালস",
  "এইস / ACE": "স্কয়ার ফার্মাসিউটিক্যালস",
  Fast: "এসিআই লিমিটেড",
  Pyrex: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Reset: "অপসোনিন ফার্মা",
  "প্যারাসিটামল ট্যাবলেট": "এসেনসিয়াল ড্রাগস কোম্পানি",
  Tylenol: "জনসন অ্যান্ড জনসন",
  // Amoxicillin brands
  Moxacil: "স্কয়ার ফার্মাসিউটিক্যালস",
  Amoxil: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Bactamox: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Amoxicap: "একমি ল্যাবরেটরিজ",
  Moxilen: "অপসোনিন ফার্মা",
  Amoclan: "এসকেয়েফ ফার্মাসিউটিক্যালস",
  Tycil: "রেনেটা লিমিটেড",
  // Metronidazole brands
  Amodis: "স্কয়ার ফার্মাসিউটিক্যালস",
  Flagyl: "অপসোনিন ফার্মা",
  Metryl: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Filmet: "রেনেটা লিমিটেড",
  Trichozole: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  // Omeprazole brands
  Losectil: "স্কয়ার ফার্মাসিউটিক্যালস",
  Omez: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Omidon: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Omeprol: "একমি ল্যাবরেটরিজ",
  Neoprazol: "রেনেটা লিমিটেড",
  Opton: "অপসোনিন ফার্মা",
  // Cetirizine brands
  Alatrol: "স্কয়ার ফার্মাসিউটিক্যালস",
  Cetizin: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Histalex: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Riz: "রেনেটা লিমিটেড",
  Ceticad: "একমি ল্যাবরেটরিজ",
  Alercet: "অপসোনিন ফার্মা",
  // Azithromycin brands
  Zithromax: "স্কয়ার ফার্মাসিউটিক্যালস",
  Zimax: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Azit: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Azithrox: "রেনেটা লিমিটেড",
  Azimac: "একমি ল্যাবরেটরিজ",
  Zetro: "অপসোনিন ফার্মা",
  Atm: "এসকেয়েফ ফার্মাসিউটিক্যালস",
  // Ciprofloxacin brands
  Ciprocin: "স্কয়ার ফার্মাসিউটিক্যালস",
  Cipro: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Ciproflox: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  "Cipro-A": "একমি ল্যাবরেটরিজ",
  Ciplox: "রেনেটা লিমিটেড",
  Neofloxin: "অপসোনিন ফার্মা",
  // Diclofenac brands
  Voveran: "স্কয়ার ফার্মাসিউটিক্যালস",
  Diclofen: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Divon: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Cataflam: "নোভার্টিস",
  Dicsol: "একমি ল্যাবরেটরিজ",
  Dolo: "অপসোনিন ফার্মা",
  // Ranitidine brands
  Neotak: "স্কয়ার ফার্মাসিউটিক্যালস",
  Ranison: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Radin: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Rantac: "একমি ল্যাবরেটরিজ",
  Gastrol: "অপসোনিন ফার্মা",
  // Salbutamol brands
  Ventolin: "স্কয়ার ফার্মাসিউটিক্যালস",
  Salmol: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Salbuvent: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Asmalin: "রেনেটা লিমিটেড",
  Sultolin: "একমি ল্যাবরেটরিজ",
  // Amlodipine brands
  Amdocal: "স্কয়ার ফার্মাসিউটিক্যালস",
  Amlocard: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Amlodin: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Amtas: "রেনেটা লিমিটেড",
  Norvasc: "ফাইজার",
  Amlovas: "একমি ল্যাবরেটরিজ",
  // Metformin brands
  Glucomin: "স্কয়ার ফার্মাসিউটিক্যালস",
  Formet: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Metformi: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Formit: "রেনেটা লিমিটেড",
  Metfor: "একমি ল্যাবরেটরিজ",
  Diabecon: "অপসোনিন ফার্মা",
  // Atorvastatin brands
  Atova: "স্কয়ার ফার্মাসিউটিক্যালস",
  Lipitor: "ফাইজার / বেক্সিমকো",
  Atorin: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Atrovas: "রেনেটা লিমিটেড",
  Lipostat: "একমি ল্যাবরেটরিজ",
  // Fluconazole brands
  Flucoral: "স্কয়ার ফার্মাসিউটিক্যালস",
  Fluzole: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Flucon: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Flucos: "রেনেটা লিমিটেড",
  Diflu: "একমি ল্যাবরেটরিজ",
  // Clotrimazole brands
  Candid: "স্কয়ার ফার্মাসিউটিক্যালস",
  Clotrin: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  "Myco-F": "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Fungidal: "রেনেটা লিমিটেড",
  // Cefuroxime brands
  Zinnat: "স্কয়ার ফার্মাসিউটিক্যালস",
  "Cef-3": "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Cefim: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Cefurox: "একমি ল্যাবরেটরিজ",
  Xorimax: "রেনেটা লিমিটেড",
  // Pantoprazole brands
  Pantop: "স্কয়ার ফার্মাসিউটিক্যালস",
  Pantonix: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Panto: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Pantocid: "রেনেটা লিমিটেড",
  Pantosec: "একমি ল্যাবরেটরিজ",
  // Levofloxacin brands
  Lebact: "স্কয়ার ফার্মাসিউটিক্যালস",
  Levoflox: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Levotas: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Tavanic: "অপসোনিন ফার্মা",
  Lefox: "রেনেটা লিমিটেড",
  // Ibuprofen brands
  Brufen: "স্কয়ার ফার্মাসিউটিক্যালস",
  Ibufen: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Ibugesic: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Nurofen: "রেনেটা লিমিটেড",
  Profen: "একমি ল্যাবরেটরিজ",
  Advil: "অপসোনিন ফার্মা",
  // Fexofenadine brands
  Fexo: "স্কয়ার ফার্মাসিউটিক্যালস",
  Telfast: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Fexodine: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Allegra: "অপসোনিন ফার্মা",
  Fexofed: "রেনেটা লিমিটেড",
  // Montelukast brands
  Singulair: "MSD / স্কয়ার ফার্মাসিউটিক্যালস",
  Montair: "বেক্সিমকো ফার্মাসিউটিক্যালস",
  Montexa: "ইনসেপ্টা ফার্মাসিউটিক্যালস",
  Montek: "রেনেটা লিমিটেড",
};

function getCompanyForBrand(
  brandName: string,
  customBrandCompany: Record<string, string>,
): string {
  return BRAND_TO_COMPANY[brandName] || customBrandCompany[brandName] || "";
}
function getBrandsForGeneric(
  genericName: string,
  customBrandsByGeneric: Record<string, string[]>,
): string[] {
  const normalized = genericName.trim().toLowerCase();
  if (!normalized) return [];
  const matchingKey = Object.keys(GENERIC_TO_BRANDS).find(
    (key) =>
      key.toLowerCase().includes(normalized) ||
      normalized.includes(key.toLowerCase()),
  );
  const baseBrands = matchingKey ? GENERIC_TO_BRANDS[matchingKey] : [];
  const customBrands = customBrandsByGeneric[normalized] || [];
  return [...new Set([...baseBrands, ...customBrands])];
}

function PurchasesPage({
  medicines,
  purchases,
  onRefresh,
  actor,
}: {
  medicines: MedicineRecord[];
  purchases: PurchaseRecord[];
  onRefresh: () => void;
  actor: backendInterface | null;
}) {
  const [medicineName, setMedicineName] = useState("");
  const [strength, setStrength] = useState("");
  const [brand, setBrand] = useState("");
  const [itemType, setItemType] = useState("Tablet");
  const [qty, setQty] = useState("1");
  const [qtyUnit, setQtyUnit] = useState("Piece");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierMobile, setSupplierMobile] = useState("");
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [selectedExportSupplier, setSelectedExportSupplier] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [minStockAlert, setMinStockAlert] = useState("10");
  const [saving, setSaving] = useState(false);
  const [customBrandsByGeneric, setCustomBrandsByGeneric] = useState<
    Record<string, string[]>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("customBrandsByGeneric") || "{}");
    } catch {
      return {};
    }
  });
  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [newCompanyInput, setNewCompanyInput] = useState("");
  const [customBrandCompany, setCustomBrandCompany] = useState<
    Record<string, string>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("customBrandCompany") || "{}");
    } catch {
      return {};
    }
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [units, setUnits] = useState<string[]>(getQtyUnits());
  const [newUnit, setNewUnit] = useState("");

  const suggestions =
    medicineName.trim().length > 0
      ? medicines
          .filter((m) =>
            m.name.toLowerCase().includes(medicineName.trim().toLowerCase()),
          )
          .slice(0, 8)
      : [];

  function selectSuggestion(m: MedicineRecord) {
    setMedicineName(m.name);
    setStrength("");
    setBrand(m.brand);
    setCompanyName(getCompanyForBrand(m.brand, customBrandCompany));
    setItemType(m.itemType);
    setSellingPrice(String(Number(m.sellingPrice)));
    setCostPrice(String(Number(m.purchasePrice)));
    setShowSuggestions(false);
  }

  function addCustomBrand() {
    const trimmed = newBrandInput.trim();
    if (!trimmed) return;
    const genericKey = medicineName.trim().toLowerCase();
    const updated = {
      ...customBrandsByGeneric,
      [genericKey]: [...(customBrandsByGeneric[genericKey] || []), trimmed],
    };
    setCustomBrandsByGeneric(updated);
    localStorage.setItem("customBrandsByGeneric", JSON.stringify(updated));
    if (newCompanyInput.trim()) {
      const updatedCompany = {
        ...customBrandCompany,
        [trimmed]: newCompanyInput.trim(),
      };
      setCustomBrandCompany(updatedCompany);
      localStorage.setItem(
        "customBrandCompany",
        JSON.stringify(updatedCompany),
      );
      setCompanyName(newCompanyInput.trim());
    }
    setBrand(trimmed);
    setNewBrandInput("");
    setNewCompanyInput("");
    setShowAddBrandDialog(false);
  }

  function handleSupplierChange(value: string) {
    setSupplier(value);
    setShowSupplierSuggestions(value.trim().length > 0);
    const dir = getSupplierDirectory();
    const found = dir[value.trim()];
    if (found) {
      setSupplierAddress(found.address);
      setSupplierMobile(found.mobile);
    }
  }

  const supplierSuggestions =
    supplier.trim().length > 0
      ? Object.keys(getSupplierDirectory())
          .filter((k) =>
            k.toLowerCase().includes(supplier.trim().toLowerCase()),
          )
          .slice(0, 6)
      : [];

  function addUnit() {
    const v = newUnit.trim();
    if (!v) return;
    saveQtyUnit(v);
    setUnits(getQtyUnits());
    setQtyUnit(v);
    setNewUnit("");
  }

  async function handleSubmit() {
    if (!medicineName.trim()) {
      toast.error("ওষুধের নাম দিন");
      return;
    }
    if (!qty || Number.parseInt(qty) <= 0) {
      toast.error("পরিমাণ দিন");
      return;
    }
    setSaving(true);
    try {
      const qtyNum = Number.parseInt(qty) || 0;
      const cost = Math.round(Number.parseFloat(costPrice) || 0);
      const sell = Math.round(Number.parseFloat(sellingPrice) || 0);
      const minAlert = Math.round(Number.parseFloat(minStockAlert) || 10);

      const existing = medicines.find(
        (m) => m.name.toLowerCase() === medicineName.trim().toLowerCase(),
      );

      let medicineId = BigInt(0);
      if (existing) {
        medicineId = existing.id;
        const updated: MedicineRecord = {
          ...existing,
          quantity: existing.quantity + BigInt(qtyNum),
          purchasePrice: BigInt(cost),
          sellingPrice: BigInt(sell),
          expiryDate: expiryDate
            ? dateStringToNano(expiryDate)
            : existing.expiryDate,
          minStockAlert: BigInt(minAlert),
        };
        await actor?.updateMedicine(existing.id, updated);
      } else {
        const newMed: MedicineRecord = {
          id: BigInt(0),
          name: medicineName.trim(),
          brand: brand.trim(),
          itemType,
          purchasePrice: BigInt(cost),
          sellingPrice: BigInt(sell),
          quantity: BigInt(qtyNum),
          minStockAlert: BigInt(minAlert),
          expiryDate: expiryDate ? dateStringToNano(expiryDate) : BigInt(0),
          createdAt: nowNano(),
        };
        await actor?.addMedicine(newMed);
      }

      const purchase: PurchaseRecord = {
        id: BigInt(0),
        medicineId,
        medicineName: medicineName.trim(),
        quantity: BigInt(qtyNum),
        unitPrice: BigInt(cost),
        totalPrice: BigInt(qtyNum * cost),
        supplierName: supplier.trim(),
        date: nowNano(),
      };
      if (supplier.trim()) {
        saveSupplierToDirectory({
          name: supplier.trim(),
          address: supplierAddress.trim(),
          mobile: supplierMobile.trim(),
        });
      }
      await actor?.createPurchase(purchase);

      toast.success("ক্রয় সম্পন্ন — স্টকে যোগ হয়েছে");
      setMedicineName("");
      setStrength("");
      setBrand("");
      setCompanyName("");
      setNewCompanyInput("");
      setItemType("Tablet");
      setQty("1");
      setQtyUnit("Piece");
      setCostPrice("");
      setSellingPrice("");
      setSupplier("");
      setSupplierAddress("");
      setSupplierMobile("");
      setExpiryDate("");
      setMinStockAlert("10");
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  const sortedPurchases = [...purchases].sort((a, b) =>
    Number(b.date - a.date),
  );

  const uniqueSuppliers = [
    ...new Set(sortedPurchases.map((p) => p.supplierName).filter(Boolean)),
  ];

  function exportOrderSheetPDF(supplierName: string) {
    const filtered = sortedPurchases.filter(
      (p) => p.supplierName === supplierName,
    );
    if (filtered.length === 0) {
      toast.error("এই সরবরাহকারীর কোনো ক্রয় নেই");
      return;
    }
    const settings: {
      name?: string;
      address?: string;
      phone?: string;
      logoUrl?: string;
    } = JSON.parse(localStorage.getItem("pharmacySettings") || "{}");
    const supplierDir = getSupplierDirectory();
    const sup = supplierDir[supplierName] || {
      name: supplierName,
      address: "",
      mobile: "",
    };
    const totalAmount = filtered.reduce(
      (sum, p) => sum + Number(p.totalPrice),
      0,
    );
    const dateStr = new Date().toLocaleDateString("bn-BD");

    const rows = filtered
      .map(
        (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.medicineName}</td>
        <td>${String(p.quantity)}</td>
        <td>৳${Number(p.unitPrice).toLocaleString("bn-BD")}</td>
        <td>৳${Number(p.totalPrice).toLocaleString("bn-BD")}</td>
      </tr>
    `,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8"/>
<title>অর্ডার শীট - ${supplierName}</title>
<style>
  body { font-family: 'Noto Sans Bengali', Arial, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #1F6D63; padding-bottom: 12px; margin-bottom: 20px; }
  .logo { width: 70px; height: 70px; object-fit: contain; }
  .pharmacy-name { font-size: 22px; font-weight: bold; color: #1F6D63; }
  .pharmacy-details { font-size: 13px; color: #555; }
  .title-section { text-align: center; margin: 16px 0 20px; }
  .title-section h2 { font-size: 20px; font-weight: bold; color: #1F6D63; margin: 0; }
  .title-section p { font-size: 13px; color: #555; margin: 4px 0 0; }
  .to-section { background: #f0f7f6; border-left: 4px solid #1F6D63; padding: 10px 14px; margin-bottom: 20px; border-radius: 4px; }
  .to-section strong { color: #1F6D63; font-size: 13px; display: block; margin-bottom: 4px; }
  .to-section p { margin: 2px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { background: #1F6D63; color: white; padding: 8px 10px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f8f8f8; }
  .total-row td { font-weight: bold; background: #e8f4f2 !important; color: #1F6D63; font-size: 15px; }
  .footer { margin-top: 30px; text-align: center; font-size: 13px; color: #777; border-top: 1px dashed #ccc; padding-top: 14px; }
  @media print { body { padding: 10px; } }
</style>
</head>
<body>
<div class="header">
  ${settings.logoUrl ? `<img class="logo" src="${settings.logoUrl}" alt="logo"/>` : ""}
  <div>
    <div class="pharmacy-name">${settings.name || "সাওম ফার্মেসি"}</div>
    <div class="pharmacy-details">${settings.address || ""} ${settings.phone ? `| ☎ ${settings.phone}` : ""}</div>
  </div>
</div>

<div class="title-section">
  <h2>অর্ডার শীট / Order Sheet</h2>
  <p>তারিখ: ${dateStr}</p>
</div>

<div class="to-section">
  <strong>প্রতি (সরবরাহকারী):</strong>
  <p><strong>${sup.name}</strong></p>
  ${sup.address ? `<p>📍 ${sup.address}</p>` : ""}
  ${sup.mobile ? `<p>📞 ${sup.mobile}</p>` : ""}
</div>

<table>
  <thead>
    <tr>
      <th>ক্রম</th>
      <th>ঔষধের নাম</th>
      <th>পরিমাণ</th>
      <th>একক মূল্য</th>
      <th>মোট</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td colspan="4" style="text-align:right;">সর্বমোট:</td>
      <td>৳${totalAmount.toLocaleString("bn-BD")}</td>
    </tr>
  </tbody>
</table>

<div class="footer">
  <p>সম্মানের সাথে প্রেরিত &mdash; ${settings.name || "সাওম ফার্মেসি"}</p>
  <p>${settings.address || ""} ${settings.phone ? `| ☎ ${settings.phone}` : ""}</p>
</div>

<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ক্রয়</h1>

        <div className="bg-card rounded-lg shadow-card p-5">
          <h2 className="font-semibold mb-4">নতুন ক্রয় এন্ট্রি</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Medicine name with autocomplete */}
            <div className="relative lg:col-span-2">
              <Label>ঔষধের নাম (Generic Name) *</Label>
              <Input
                data-ocid="purchases.input"
                value={medicineName}
                onChange={(e) => {
                  setMedicineName(e.target.value);
                  setBrand("");
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Generic Name লিখুন (যেমন: Paracetamol, Amoxicillin)"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-card border rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                  {suggestions.map((m) => (
                    <button
                      key={String(m.id)}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onMouseDown={() => selectSuggestion(m)}
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({m.brand})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Strength/Size</Label>
              <Input
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="যেমন: 500mg, 100ml"
              />
            </div>

            <div>
              <Label>ব্র্যান্ড নেম</Label>
              <Select
                value={brand}
                onValueChange={(v) => {
                  if (v === "__add_new__") {
                    setShowAddBrandDialog(true);
                  } else {
                    setBrand(v);
                    setCompanyName(getCompanyForBrand(v, customBrandCompany));
                  }
                }}
              >
                <SelectTrigger data-ocid="purchases.brand.select">
                  <SelectValue placeholder="ব্র্যান্ড নেম নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {getBrandsForGeneric(medicineName, customBrandsByGeneric)
                    .length === 0 &&
                    medicineName.trim() && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        এই জেনেরিকের ব্র্যান্ড পাওয়া যায়নি
                      </div>
                    )}
                  {getBrandsForGeneric(medicineName, customBrandsByGeneric).map(
                    (b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ),
                  )}
                  <SelectItem
                    value="__add_new__"
                    className="text-primary font-medium"
                  >
                    + নতুন ব্র্যান্ড যোগ করুন
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>কোম্পানি নেম</Label>
              <Input
                value={companyName}
                readOnly
                placeholder="ব্র্যান্ড নির্বাচনে স্বয়ংক্রিয় পূরণ হবে"
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div>
              <Label>ধরন</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger data-ocid="purchases.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Tablet",
                    "Syrup",
                    "Capsule",
                    "Injection",
                    "Cream",
                    "Drop",
                    "Powder",
                    "Inhaler",
                    "Suppository",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>পরিমাণ ও ইউনিট</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-24"
                />
                <Select value={qtyUnit} onValueChange={setQtyUnit}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                    <div className="flex gap-1 p-2 border-t">
                      <input
                        className="flex-1 text-sm border rounded px-2 py-1"
                        placeholder="নতুন ইউনিট"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addUnit()}
                      />
                      <button
                        type="button"
                        className="text-xs bg-primary text-primary-foreground px-2 rounded"
                        onClick={addUnit}
                      >
                        +
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>ক্রয়মূল্য / Cost Price (৳)</Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="০"
              />
            </div>

            <div>
              <Label>বিক্রয়মূল্য / Selling Price (৳)</Label>
              <Input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="০"
              />
            </div>

            <div className="relative">
              <Label>Supplier নাম</Label>
              <Input
                value={supplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                onBlur={() =>
                  setTimeout(() => setShowSupplierSuggestions(false), 150)
                }
                onFocus={() =>
                  setShowSupplierSuggestions(supplier.trim().length > 0)
                }
                placeholder="সরবরাহকারীর নাম"
              />
              {showSupplierSuggestions && supplierSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-card border rounded-lg shadow-lg mt-1 max-h-40 overflow-auto">
                  {supplierSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onMouseDown={() => {
                        const dir = getSupplierDirectory();
                        const found = dir[s];
                        setSupplier(s);
                        if (found) {
                          setSupplierAddress(found.address);
                          setSupplierMobile(found.mobile);
                        }
                        setShowSupplierSuggestions(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>সরবরাহকারীর ঠিকানা</Label>
              <Input
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                placeholder="ঠিকানা লিখুন"
              />
            </div>

            <div>
              <Label>সরবরাহকারীর মোবাইল নম্বর</Label>
              <Input
                value={supplierMobile}
                onChange={(e) => setSupplierMobile(e.target.value)}
                placeholder="মোবাইল নম্বর"
              />
            </div>

            <div>
              <Label>মেয়াদ উত্তীর্ণ তারিখ</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <Label>সর্বনিম্ন স্টক সতর্কতা</Label>
              <Input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
              />
            </div>

            <div className="lg:col-span-3 flex justify-end pt-2">
              <Button
                data-ocid="purchases.submit_button"
                onClick={handleSubmit}
                disabled={saving}
                style={{ backgroundColor: "#1F6D63" }}
                className="px-8"
              >
                {saving ? "সংরক্ষণ হচ্ছে..." : "ক্রয় নিশ্চিত করুন — স্টকে যোগ করুন"}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card overflow-auto">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="font-semibold flex-1">ক্রয় ইতিহাস</h2>
            <div className="flex items-center gap-2">
              <select
                className="border rounded px-2 py-1 text-sm bg-background"
                value={selectedExportSupplier}
                onChange={(e) => setSelectedExportSupplier(e.target.value)}
              >
                <option value="">— সরবরাহকারী বেছে নিন —</option>
                {uniqueSuppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="flex items-center gap-1 bg-emerald-700 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-800 transition-colors"
                onClick={() => {
                  if (!selectedExportSupplier) {
                    toast.error("প্রথমে একটি সরবরাহকারী বেছে নিন");
                    return;
                  }
                  exportOrderSheetPDF(selectedExportSupplier);
                }}
                data-ocid="purchases.primary_button"
              >
                <FileText className="w-4 h-4" />
                অর্ডার শীট PDF
              </button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>ঔষধ</TableHead>
                <TableHead>পরিমাণ</TableHead>
                <TableHead>ক্রয়মূল্য</TableHead>
                <TableHead>মোট</TableHead>
                <TableHead>সরবরাহকারী</TableHead>
                <TableHead>মোবাইল</TableHead>
                <TableHead>তারিখ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPurchases.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                    data-ocid="purchases.empty_state"
                  >
                    কোনো ক্রয় নেই।
                  </TableCell>
                </TableRow>
              )}
              {sortedPurchases.map((p, i) => (
                <TableRow
                  key={String(p.id)}
                  data-ocid={`purchases.item.${i + 1}`}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{p.medicineName}</TableCell>
                  <TableCell>{String(p.quantity)}</TableCell>
                  <TableCell>{taka(Number(p.unitPrice))}</TableCell>
                  <TableCell className="font-semibold">
                    {taka(Number(p.totalPrice))}
                  </TableCell>
                  <TableCell>{p.supplierName || "—"}</TableCell>
                  <TableCell>
                    {(() => {
                      const dir = getSupplierDirectory();
                      return dir[p.supplierName]?.mobile || "—";
                    })()}
                  </TableCell>
                  <TableCell>{formatDate(p.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
        <DialogContent data-ocid="purchases.brand.dialog">
          <DialogHeader>
            <DialogTitle>নতুন ব্র্যান্ড যোগ করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Label>
              {medicineName || "এই জেনেরিক"}-এর জন্য নতুন ব্র্যান্ড নাম যোগ করুন
            </Label>
            <Input
              value={newBrandInput}
              onChange={(e) => setNewBrandInput(e.target.value)}
              placeholder="ব্র্যান্ড নাম লিখুন..."
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomBrand();
              }}
              autoFocus
              data-ocid="purchases.brand.input"
            />
            <Label>কোম্পানি নাম</Label>
            <Input
              value={newCompanyInput}
              onChange={(e) => setNewCompanyInput(e.target.value)}
              placeholder="কোম্পানির নাম লিখুন (ঐচ্ছিক)"
              data-ocid="purchases.brand.company_input"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddBrandDialog(false)}
              data-ocid="purchases.brand.cancel_button"
            >
              বাতিল
            </Button>
            <Button
              onClick={addCustomBrand}
              disabled={!newBrandInput.trim()}
              data-ocid="purchases.brand.submit_button"
            >
              যোগ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExtraCostsSection />
    </>
  );
}

function ExtraCostsSection() {
  type CostEntry = { id: string; amount: number; date: string; note?: string };

  const costTypes = [
    {
      key: "pharma_extra_cost_transport",
      label: "গাড়ি ভাড়া",
      color: "#EA580C",
      Icon: Car,
      ocidPrefix: "transport_cost",
    },
    {
      key: "pharma_extra_cost_loading",
      label: "লোডিং খরচ",
      color: "#0F766E",
      Icon: Package,
      ocidPrefix: "loading_cost",
    },
    {
      key: "pharma_extra_cost_unloading",
      label: "আনলোডিং খরচ",
      color: "#4338CA",
      Icon: PackageOpen,
      ocidPrefix: "unloading_cost",
    },
  ] as const;

  const today = new Date().toISOString().split("T")[0];

  function loadEntries(key: string): CostEntry[] {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function saveEntries(key: string, entries: CostEntry[]) {
    try {
      localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }

  const [states, setStates] = useState(() =>
    costTypes.map((ct) => ({
      amount: "",
      date: today,
      note: "",
      entries: loadEntries(ct.key),
    })),
  );

  function update(idx: number, field: string, value: string) {
    setStates((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  }

  function saveEntry(idx: number) {
    const ct = costTypes[idx];
    const s = states[idx];
    const amt = Number.parseFloat(s.amount);
    if (!amt || amt <= 0) {
      toast.error("সঠিক টাকার পরিমাণ দিন");
      return;
    }
    const newEntry: CostEntry = {
      id: String(Date.now()),
      amount: amt,
      date: s.date,
      note: s.note.trim() || undefined,
    };
    const updated = [newEntry, ...loadEntries(ct.key)];
    saveEntries(ct.key, updated);
    setStates((prev) =>
      prev.map((st, i) =>
        i === idx ? { ...st, amount: "", note: "", entries: updated } : st,
      ),
    );
    toast.success(`${ct.label} সংরক্ষিত হয়েছে`);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-1 h-6 rounded-full"
          style={{
            background: "linear-gradient(to bottom, #EA580C, #0F766E, #4338CA)",
          }}
        />
        <h2 className="text-lg font-bold text-foreground">অতিরিক্ত খরচ</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {costTypes.map((ct, idx) => {
          const s = states[idx];
          const Icon = ct.Icon;
          return (
            <div
              key={ct.key}
              className="rounded-xl border-2 bg-card p-4 shadow-sm"
              style={{ borderColor: `${ct.color}33` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: `${ct.color}18` }}
                >
                  <Icon size={18} style={{ color: ct.color }} />
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{ color: ct.color }}
                >
                  {ct.label}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="টাকা"
                    value={s.amount}
                    onChange={(e) => update(idx, "amount", e.target.value)}
                    className="text-sm"
                    data-ocid={`${ct.ocidPrefix}.amount.input`}
                  />
                  <Input
                    type="date"
                    value={s.date}
                    onChange={(e) => update(idx, "date", e.target.value)}
                    className="text-sm"
                    data-ocid={`${ct.ocidPrefix}.date.input`}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full text-white font-semibold"
                  style={{ background: ct.color }}
                  onClick={() => saveEntry(idx)}
                  data-ocid={`${ct.ocidPrefix}.save_button`}
                >
                  সংরক্ষণ করুন
                </Button>
              </div>
              {s.entries.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    সাম্প্রতিক এন্ট্রি:
                  </p>
                  {s.entries.slice(0, 5).map((e, ei) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                      style={{ background: `${ct.color}0D` }}
                      data-ocid={`${ct.ocidPrefix}.item.${ei + 1}`}
                    >
                      <span className="text-muted-foreground">
                        {e.note || e.date}
                      </span>
                      <span className="font-bold" style={{ color: ct.color }}>
                        ৳{e.amount.toLocaleString("bn-BD")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Due Records Page (Ledger) ────────────────────────────────────────────────

type DueGroup = {
  key: string;
  date: bigint;
  village: string;
  neighborhood: string;
  customerName: string;
  fatherName: string;
  mobile: string;
  items: {
    medicineName: string;
    quantity: bigint;
    itemType: string;
    unitPrice: bigint;
    totalPrice: bigint;
    id: bigint;
    status: string;
  }[];
  totalPrice: number;
  status: string;
};

function groupDueRecords(records: DueRecord[]): DueGroup[] {
  const map = new Map<string, DueGroup>();
  for (const r of records) {
    const key = `${r.customerName}|${r.village}|${r.neighborhood}|${r.mobile}|${r.date}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        date: r.date,
        village: r.village,
        neighborhood: r.neighborhood,
        customerName: r.customerName,
        fatherName: r.fatherName,
        mobile: r.mobile,
        items: [],
        totalPrice: 0,
        status: "Paid",
      });
    }
    const g = map.get(key)!;
    g.items.push({
      medicineName: r.medicineName,
      quantity: r.quantity,
      itemType: r.itemType,
      unitPrice: r.unitPrice,
      totalPrice: r.totalPrice,
      id: r.id,
      status: r.status,
    });
    g.totalPrice += Number(r.totalPrice);
    if (r.status === "Due") g.status = "Due";
  }
  return Array.from(map.values()).sort((a, b) => Number(b.date - a.date));
}

function DueKhataPage({
  medicines: _medicines,
  dueRecords,
  onRefresh,
  actor,
}: {
  medicines: MedicineRecord[];
  dueRecords: DueRecord[];
  onRefresh: () => void;
  actor: backendInterface | null;
}) {
  // Only show Due status records
  const duePending = dueRecords.filter((r) => r.status === "Due");

  const [selectedVillages, setSelectedVillages] = useState<Set<string>>(
    new Set(Object.keys(VILLAGES)),
  );
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<
    Set<string>
  >(new Set(Object.values(VILLAGES).flat()));
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cashPaidMap, setCashPaidMap] = useState<Record<string, number>>(() => {
    return JSON.parse(localStorage.getItem("pharma_customer_cashpaid") || "{}");
  });
  const [editingCashKey, setEditingCashKey] = useState<string | null>(null);
  const [cashInputVal, setCashInputVal] = useState("");
  const [printMode, setPrintMode] = useState<"village" | "customer" | null>(
    null,
  );
  const [printCustomerKey, setPrintCustomerKey] = useState<string | null>(null);

  // Group all due pending records
  const allGroups = groupDueRecords(duePending);

  // Filter groups
  const filteredGroups = allGroups.filter((g) => {
    if (selectedVillages.size > 0 && !selectedVillages.has(g.village))
      return false;
    if (
      selectedNeighborhoods.size > 0 &&
      !selectedNeighborhoods.has(g.neighborhood)
    )
      return false;
    if (
      searchQuery &&
      !g.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Suggestions from filtered groups
  const suggestions = searchQuery
    ? Array.from(new Set(allGroups.map((g) => g.customerName)))
        .filter((n) => n.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 8)
    : [];

  function toggleVillage(v: string) {
    setSelectedVillages((prev) => {
      const next = new Set(prev);
      if (next.has(v)) {
        next.delete(v);
        // also deselect all its neighborhoods
        const paras = VILLAGES[v] || [];
        setSelectedNeighborhoods((pn) => {
          const nn = new Set(pn);
          for (const p of paras) nn.delete(p);
          return nn;
        });
      } else {
        next.add(v);
        // select all its neighborhoods
        const paras = VILLAGES[v] || [];
        setSelectedNeighborhoods((pn) => {
          const nn = new Set(pn);
          for (const p of paras) nn.add(p);
          return nn;
        });
      }
      return next;
    });
  }

  function toggleNeighborhood(para: string) {
    setSelectedNeighborhoods((prev) => {
      const next = new Set(prev);
      if (next.has(para)) next.delete(para);
      else next.add(para);
      return next;
    });
  }

  function selectAll() {
    setSelectedVillages(new Set(Object.keys(VILLAGES)));
    setSelectedNeighborhoods(new Set(Object.values(VILLAGES).flat()));
  }

  function deselectAll() {
    setSelectedVillages(new Set());
    setSelectedNeighborhoods(new Set());
  }

  function getCashPaid(
    customerName: string,
    village: string,
    neighborhood: string,
  ): number {
    const key = `${customerName}|${village}|${neighborhood}`;
    return cashPaidMap[key] || 0;
  }

  function saveCashPaid(
    customerName: string,
    village: string,
    neighborhood: string,
    amount: number,
  ) {
    const key = `${customerName}|${village}|${neighborhood}`;
    const updated = { ...cashPaidMap, [key]: amount };
    setCashPaidMap(updated);
    localStorage.setItem("pharma_customer_cashpaid", JSON.stringify(updated));
  }

  async function handleMarkGroupPaid(group: DueGroup) {
    try {
      for (const item of group.items) {
        if (item.status === "Due") await actor?.markDueAsPaid(item.id);
      }
      // Clear cash paid for this customer
      const key = `${group.customerName}|${group.village}|${group.neighborhood}`;
      const updated = { ...cashPaidMap };
      delete updated[key];
      setCashPaidMap(updated);
      localStorage.setItem("pharma_customer_cashpaid", JSON.stringify(updated));
      toast.success("পরিশোধ হিসেবে চিহ্নিত হয়েছে");
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    }
  }

  function handlePrintVillage() {
    setPrintMode("village");
    setPrintCustomerKey(null);
    setTimeout(() => window.print(), 300);
  }

  function handlePrintCustomer(group: DueGroup) {
    setPrintMode("customer");
    setPrintCustomerKey(group.key);
    setTimeout(() => window.print(), 300);
  }

  const printCustomerGroup = printCustomerKey
    ? filteredGroups.find((g) => g.key === printCustomerKey) || null
    : null;

  const totalDue = filteredGroups.reduce((sum, g) => {
    const cashPaid = getCashPaid(g.customerName, g.village, g.neighborhood);
    return sum + Math.max(0, g.totalPrice - cashPaid);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">বকেয়া খাতা</h1>
          <p className="text-sm text-muted-foreground">
            শুধুমাত্র বাকি বিক্রয়ের স্বয়ংক্রিয় তালিকা
          </p>
        </div>
        <Button
          onClick={handlePrintVillage}
          variant="outline"
          className="gap-2"
          data-ocid="due.village.print.button"
        >
          <Printer size={16} /> গ্রামভিত্তিক PDF
        </Button>
      </div>

      {/* Village/Para Filter */}
      <div className="bg-card rounded-lg shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">গ্রাম ও পাড়া ফিল্টার</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={selectAll}
              data-ocid="due.filter.select_all.button"
            >
              সব নির্বাচন
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={deselectAll}
              data-ocid="due.filter.deselect.button"
            >
              বাতিল
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {Object.entries(VILLAGES).map(([village, paras]) => (
            <div key={village} className="flex flex-col gap-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                <input
                  type="checkbox"
                  checked={selectedVillages.has(village)}
                  onChange={() => toggleVillage(village)}
                  className="w-4 h-4 accent-primary"
                  data-ocid={"due.village.checkbox"}
                />
                {village}
              </label>
              {selectedVillages.has(village) && (
                <div className="ml-5 flex flex-col gap-1">
                  {paras.map((para) => (
                    <label
                      key={para}
                      className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNeighborhoods.has(para)}
                        onChange={() => toggleNeighborhood(para)}
                        className="w-3.5 h-3.5 accent-primary"
                        data-ocid={"due.neighborhood.checkbox"}
                      />
                      {para}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="গ্রাহকের নাম খুঁজুন..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          data-ocid="due.search_input"
          className="w-full"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 bg-popover border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                onMouseDown={() => {
                  setSearchQuery(name);
                  setShowSuggestions(false);
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-card rounded-lg shadow-card px-4 py-2 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">মোট গ্রাহক:</span>
          <span className="font-bold">{filteredGroups.length}</span>
        </div>
        <div className="bg-card rounded-lg shadow-card px-4 py-2 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">মোট বকেয়া:</span>
          <span className="font-bold text-destructive">{taka(totalDue)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>গ্রাম / পাড়া</TableHead>
              <TableHead>গ্রাহক নাম / পিতা</TableHead>
              <TableHead>মোবাইল</TableHead>
              <TableHead>আইটেম ও পরিমাণ</TableHead>
              <TableHead className="text-right">মোট বিল</TableHead>
              <TableHead className="text-right">নগদ পরিশোধ</TableHead>
              <TableHead className="text-right">বাকি</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="due.empty_state"
                >
                  কোনো বকেয়া নেই।
                </TableCell>
              </TableRow>
            )}
            {filteredGroups.map((g, i) => {
              const cashPaid = getCashPaid(
                g.customerName,
                g.village,
                g.neighborhood,
              );
              const baki = Math.max(0, g.totalPrice - cashPaid);
              const custKey = `${g.customerName}|${g.village}|${g.neighborhood}`;
              return (
                <TableRow key={g.key} data-ocid={`due.item.${i + 1}`}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{g.village}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.neighborhood}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{g.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.fatherName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {g.mobile ? (
                      <a
                        href={`tel:${g.mobile}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Phone size={12} /> {g.mobile}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {g.items.map((it, j) => (
                        <div
                          key={String(it.id) + String(j)}
                          className="text-sm"
                        >
                          <span className="font-medium">{it.medicineName}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({String(it.quantity)}{" "}
                            {getDueUnit(g.date, it.medicineName) || "টি"})
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {taka(g.totalPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingCashKey === custKey ? (
                      <div className="flex gap-1 items-center justify-end">
                        <Input
                          type="number"
                          min="0"
                          className="h-7 w-24 text-sm text-right"
                          value={cashInputVal}
                          onChange={(e) => setCashInputVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveCashPaid(
                                g.customerName,
                                g.village,
                                g.neighborhood,
                                Number(cashInputVal) || 0,
                              );
                              setEditingCashKey(null);
                            }
                            if (e.key === "Escape") setEditingCashKey(null);
                          }}
                          autoFocus
                          data-ocid={`due.cash.input.${i + 1}`}
                        />
                        <Button
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => {
                            saveCashPaid(
                              g.customerName,
                              g.village,
                              g.neighborhood,
                              Number(cashInputVal) || 0,
                            );
                            setEditingCashKey(null);
                          }}
                          data-ocid={`due.cash.save_button.${i + 1}`}
                        >
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-green-700 dark:text-green-400">
                          {taka(cashPaid)}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground ml-1"
                          title="নগদ আপডেট"
                          onClick={() => {
                            setEditingCashKey(custKey);
                            setCashInputVal(String(cashPaid));
                          }}
                          data-ocid={`due.cash.edit_button.${i + 1}`}
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-destructive">
                    {taka(baki)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 hover:bg-green-50 dark:hover:bg-green-950 text-xs px-2"
                        onClick={() => handleMarkGroupPaid(g)}
                        data-ocid={`due.confirm_button.${i + 1}`}
                      >
                        <CheckCircle size={12} className="mr-1" /> পরিশোধ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2"
                        onClick={() => handlePrintCustomer(g)}
                        data-ocid={`due.print_button.${i + 1}`}
                      >
                        <Printer size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Village-level Print Area */}
      {printMode === "village" && (
        <div className="hidden print:block">
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #0F3A3D",
              paddingBottom: 12,
              marginBottom: 12,
            }}
          >
            <img
              src="/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg"
              alt="লোগো"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 8px",
              }}
            />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F3A3D" }}>
              {getPharmacyInfo().name}
            </h1>
            <p style={{ fontSize: 13 }}>{getPharmacyInfo().address}</p>
            <p style={{ fontSize: 13 }}>ফোন: {getPharmacyInfo().phone}</p>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            বকেয়া তালিকা
          </h2>
          <p style={{ fontSize: 12, marginBottom: 12, color: "#555" }}>
            তারিখ: {new Date().toLocaleDateString("bn-BD")}
          </p>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>#</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>
                  গ্রাহকের নাম
                </th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>
                  মোবাইল নম্বর
                </th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>গ্রাম</th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>পাড়া</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  মোট বকেয়া বিল
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g, i) => {
                const cashPaid = getCashPaid(
                  g.customerName,
                  g.village,
                  g.neighborhood,
                );
                const baki = Math.max(0, g.totalPrice - cashPaid);
                return (
                  <tr key={g.key} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "5px 8px" }}>{i + 1}</td>
                    <td style={{ padding: "5px 8px" }}>{g.customerName}</td>
                    <td style={{ padding: "5px 8px" }}>{g.mobile || "—"}</td>
                    <td style={{ padding: "5px 8px" }}>{g.village}</td>
                    <td style={{ padding: "5px 8px" }}>{g.neighborhood}</td>
                    <td
                      style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {taka(baki)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #333", fontWeight: 700 }}>
                <td
                  colSpan={5}
                  style={{ padding: "6px 8px", textAlign: "right" }}
                >
                  সর্বমোট বকেয়া:
                </td>
                <td style={{ padding: "6px 8px", textAlign: "right" }}>
                  {taka(totalDue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Customer-level Print Area */}
      {printMode === "customer" && printCustomerGroup && (
        <div className="hidden print:block">
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #0F3A3D",
              paddingBottom: 12,
              marginBottom: 12,
            }}
          >
            <img
              src="/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg"
              alt="লোগো"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 8px",
              }}
            />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F3A3D" }}>
              {getPharmacyInfo().name}
            </h1>
            <p style={{ fontSize: 13 }}>{getPharmacyInfo().address}</p>
            <p style={{ fontSize: 13 }}>ফোন: {getPharmacyInfo().phone}</p>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            ব্যক্তিগত বকেয়া বিবরণ
          </h2>
          <div style={{ marginBottom: 12, fontSize: 13 }}>
            <p>
              <strong>গ্রাহকের নাম:</strong> {printCustomerGroup.customerName}
            </p>
            {printCustomerGroup.fatherName && (
              <p>
                <strong>পিতার নাম:</strong> {printCustomerGroup.fatherName}
              </p>
            )}
            {printCustomerGroup.mobile && (
              <p>
                <strong>মোবাইল:</strong> {printCustomerGroup.mobile}
              </p>
            )}
            <p>
              <strong>গ্রাম:</strong> {printCustomerGroup.village}
            </p>
            <p>
              <strong>পাড়া:</strong> {printCustomerGroup.neighborhood}
            </p>
            <p>
              <strong>তারিখ:</strong> {new Date().toLocaleDateString("bn-BD")}
            </p>
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>
                  ঔষধের নাম
                </th>
                <th style={{ padding: "6px 8px", textAlign: "left" }}>পরিমাণ</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  একক দাম
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  মোট বিল
                </th>
              </tr>
            </thead>
            <tbody>
              {printCustomerGroup.items.map((it, j) => (
                <tr
                  key={String(it.id) + String(j)}
                  style={{ borderBottom: "1px solid #eee" }}
                >
                  <td style={{ padding: "5px 8px" }}>{it.medicineName}</td>
                  <td style={{ padding: "5px 8px" }}>
                    {String(it.quantity)}{" "}
                    {getDueUnit(printCustomerGroup.date, it.medicineName) ||
                      "টি"}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    {taka(Number(it.unitPrice))}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    {taka(Number(it.totalPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(() => {
            const cashPaid = getCashPaid(
              printCustomerGroup.customerName,
              printCustomerGroup.village,
              printCustomerGroup.neighborhood,
            );
            const baki = Math.max(0, printCustomerGroup.totalPrice - cashPaid);
            return (
              <div
                style={{
                  marginTop: 12,
                  borderTop: "2px solid #333",
                  paddingTop: 8,
                }}
              >
                <table style={{ width: "100%", fontSize: 13 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 8px" }}>মোট বিল:</td>
                      <td style={{ padding: "3px 8px", textAlign: "right" }}>
                        {taka(printCustomerGroup.totalPrice)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 8px" }}>নগদ পরিশোধ:</td>
                      <td style={{ padding: "3px 8px", textAlign: "right" }}>
                        {taka(cashPaid)}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: "3px 8px" }}>বাকি বকেয়া:</td>
                      <td style={{ padding: "3px 8px", textAlign: "right" }}>
                        {taka(baki)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Reports Page ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

function ReportsPage({
  sales,
  purchases,
}: {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
}) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const yearNum = Number.parseInt(year) || now.getFullYear();
  const monthNum = Number.parseInt(month) || now.getMonth() + 1;

  function filterByMonth<T extends { date: bigint }>(
    items: T[],
    m: number,
    y: number,
  ): T[] {
    return items.filter((item) => {
      const d = new Date(Number(item.date) / 1_000_000);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }

  const monthlySales = filterByMonth(sales, monthNum, yearNum);
  const monthlyPurchases = filterByMonth(purchases, monthNum, yearNum);
  const totalSalesAmount = monthlySales.reduce(
    (s, r) => s + Number(r.totalPrice),
    0,
  );
  const totalPurchaseAmount = monthlyPurchases.reduce(
    (s, r) => s + Number(r.totalPrice),
    0,
  );
  const profit = totalSalesAmount - totalPurchaseAmount;

  // Annual breakdown
  const annualData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const ms = filterByMonth(sales, m, yearNum);
    const mp = filterByMonth(purchases, m, yearNum);
    const rev = ms.reduce((s, r) => s + Number(r.totalPrice), 0);
    const cost = mp.reduce((s, r) => s + Number(r.totalPrice), 0);
    return { month: MONTH_NAMES[i], revenue: rev, cost, profit: rev - cost };
  });

  function handlePrint() {
    window.print();
  }

  const years = Array.from({ length: 5 }, (_, i) =>
    String(now.getFullYear() - i),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold">রিপোর্ট</h1>
        <Button
          onClick={handlePrint}
          data-ocid="reports.print_button"
          style={{ backgroundColor: "#1F6D63" }}
        >
          <Printer size={16} className="mr-1" /> প্রিন্ট
        </Button>
      </div>

      {/* Month/Year Filter */}
      <div className="flex gap-3 no-print">
        <div>
          <Label>মাস</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36" data-ocid="reports.month.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((n, i) => (
                <SelectItem key={n} value={String(i + 1)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>বছর</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28" data-ocid="reports.year.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Printable area */}
      <div className="print-area">
        {/* Header for print */}
        <div
          className="hidden print:block text-center mb-4 pb-4"
          style={{ borderBottom: "2px solid #0F3A3D" }}
        >
          <img
            src="/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg"
            alt="লোগো"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              objectFit: "cover",
              margin: "0 auto 8px",
            }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F3A3D" }}>
            {getPharmacyInfo().name}
          </h1>
          <p style={{ fontSize: 13 }}>
            {getPharmacyInfo().address} | ফোন: {getPharmacyInfo().phone}
          </p>
        </div>

        <h2 className="text-lg font-semibold mb-3">
          {MONTH_NAMES[monthNum - 1]} {yearNum} — মাসিক রিপোর্ট
        </h2>

        {/* Monthly summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow-card p-4 text-center">
            <p className="text-muted-foreground text-sm">মোট বিক্রয়</p>
            <p className="text-2xl font-bold text-green-700">
              {taka(totalSalesAmount)}
            </p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-4 text-center">
            <p className="text-muted-foreground text-sm">মোট ক্রয়</p>
            <p className="text-2xl font-bold text-orange-600">
              {taka(totalPurchaseAmount)}
            </p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-4 text-center">
            <p className="text-muted-foreground text-sm">মোট লাভ</p>
            <p
              className={`text-2xl font-bold ${profit >= 0 ? "text-green-700" : "text-destructive"}`}
            >
              {taka(profit)}
            </p>
          </div>
        </div>

        {/* Annual breakdown */}
        <h2 className="text-lg font-semibold mb-3">{yearNum} — বার্ষিক রিপোর্ট</h2>
        <div className="bg-card rounded-lg shadow-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>মাস</TableHead>
                <TableHead className="text-right">বিক্রয়</TableHead>
                <TableHead className="text-right">ক্রয়</TableHead>
                <TableHead className="text-right">লাভ/ক্ষতি</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {annualData.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right">
                    {taka(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right">{taka(row.cost)}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${row.profit >= 0 ? "text-green-700" : "text-destructive"}`}
                  >
                    {taka(row.profit)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted">
                <TableCell>মোট</TableCell>
                <TableCell className="text-right">
                  {taka(annualData.reduce((s, r) => s + r.revenue, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {taka(annualData.reduce((s, r) => s + r.cost, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {taka(annualData.reduce((s, r) => s + r.profit, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────

// ─── Income Page ─────────────────────────────────────────────────────────────

type IncomeRecord = {
  id: string;
  date: string;
  amount: number;
  description: string;
  category?: string;
};

function IncomePage() {
  const [records, setRecords] = useState<IncomeRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("incomeRecords") || "[]");
    } catch {
      return [];
    }
  });
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);

  function save() {
    if (!amount || Number(amount) <= 0) {
      toast.error("পরিমাণ দিন");
      return;
    }
    const newRecord: IncomeRecord = {
      id: String(Date.now()),
      date,
      amount: Number(amount),
      description: description.trim(),
      category,
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem("incomeRecords", JSON.stringify(updated));
    setAmount("");
    setDescription("");
    toast.success("আয় সংরক্ষণ হয়েছে");
  }

  function remove(id: string) {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem("incomeRecords", JSON.stringify(updated));
    toast.success("মুছে ফেলা হয়েছে");
  }

  const total = records.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-bold flex items-center gap-2"
        style={{ color: "#0F6E2E" }}
      >
        <TrendingUp size={24} /> আয়
      </h1>

      {/* Entry Form */}
      <div className="bg-card rounded-lg shadow-card p-5">
        <h2 className="font-semibold mb-4 text-lg">নতুন আয় এন্ট্রি</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>তারিখ</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="income.input"
            />
          </div>
          <div>
            <Label>বিভাগ</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-ocid="income.select"
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>পরিমাণ (৳)</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="যেমন: 5000"
              data-ocid="income.input"
            />
          </div>
          <div>
            <Label>বিবরণ</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="আয়ের বিবরণ"
              data-ocid="income.input"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={save}
          data-ocid="income.submit_button"
          style={{ backgroundColor: "#0F6E2E" }}
        >
          <Plus size={16} className="mr-1" /> সংরক্ষণ করুন
        </Button>
      </div>

      {/* Records Table */}
      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead>বিভাগ</TableHead>
              <TableHead>বিবরণ</TableHead>
              <TableHead>পরিমাণ (৳)</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="income.empty_state"
                >
                  কোনো আয় এন্ট্রি নেই।
                </TableCell>
              </TableRow>
            )}
            {records.map((r, i) => (
              <TableRow key={r.id} data-ocid={`income.item.${i + 1}`}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-medium" style={{ color: "#06B6D4" }}>
                  {r.category || INCOME_CATEGORIES[0]}
                </TableCell>
                <TableCell>{r.description || "—"}</TableCell>
                <TableCell className="font-semibold text-green-700">
                  {taka(r.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-red-50"
                    onClick={() => remove(r.id)}
                    data-ocid={`income.delete_button.${i + 1}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {records.length > 0 && (
              <TableRow className="font-bold bg-green-50">
                <TableCell colSpan={4} className="text-right">
                  মোট আয়:
                </TableCell>
                <TableCell className="text-green-700 text-lg">
                  {taka(total)}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Expense Page ─────────────────────────────────────────────────────────────

type ExpenseRecord = {
  id: string;
  date: string;
  amount: number;
  description: string;
  category?: string;
};

function ExpensePage() {
  const [records, setRecords] = useState<ExpenseRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("expenseRecords") || "[]");
    } catch {
      return [];
    }
  });
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  function save() {
    if (!amount || Number(amount) <= 0) {
      toast.error("পরিমাণ দিন");
      return;
    }
    const newRecord: ExpenseRecord = {
      id: String(Date.now()),
      date,
      amount: Number(amount),
      description: description.trim(),
      category,
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem("expenseRecords", JSON.stringify(updated));
    setAmount("");
    setDescription("");
    toast.success("ব্যয় সংরক্ষণ হয়েছে");
  }

  function remove(id: string) {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem("expenseRecords", JSON.stringify(updated));
    toast.success("মুছে ফেলা হয়েছে");
  }

  const total = records.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-bold flex items-center gap-2"
        style={{ color: "#B91C1C" }}
      >
        <TrendingDown size={24} /> ব্যয়
      </h1>

      {/* Entry Form */}
      <div className="bg-card rounded-lg shadow-card p-5">
        <h2 className="font-semibold mb-4 text-lg">নতুন ব্যয় এন্ট্রি</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>তারিখ</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="expense.input"
            />
          </div>
          <div>
            <Label>বিভাগ</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-ocid="expense.select"
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>পরিমাণ (৳)</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="যেমন: 2000"
              data-ocid="expense.input"
            />
          </div>
          <div>
            <Label>বিবরণ</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ব্যয়ের বিবরণ"
              data-ocid="expense.input"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={save}
          data-ocid="expense.submit_button"
          style={{ backgroundColor: "#B91C1C" }}
        >
          <Plus size={16} className="mr-1" /> সংরক্ষণ করুন
        </Button>
      </div>

      {/* Records Table */}
      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead>বিভাগ</TableHead>
              <TableHead>বিবরণ</TableHead>
              <TableHead>পরিমাণ (৳)</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="expense.empty_state"
                >
                  কোনো ব্যয় এন্ট্রি নেই।
                </TableCell>
              </TableRow>
            )}
            {records.map((r, i) => (
              <TableRow key={r.id} data-ocid={`expense.item.${i + 1}`}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-medium" style={{ color: "#D97706" }}>
                  {r.category || EXPENSE_CATEGORIES[0]}
                </TableCell>
                <TableCell>{r.description || "—"}</TableCell>
                <TableCell className="font-semibold text-red-700">
                  {taka(r.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-red-50"
                    onClick={() => remove(r.id)}
                    data-ocid={`expense.delete_button.${i + 1}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {records.length > 0 && (
              <TableRow className="font-bold bg-red-50">
                <TableCell colSpan={4} className="text-right">
                  মোট ব্যয়:
                </TableCell>
                <TableCell className="text-red-700 text-lg">
                  {taka(total)}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Settings Page ──────────────────────────────────────────────────────────

function SettingsPage({
  settings,
  onSave,
}: {
  settings: PharmacySettings;
  onSave: (s: PharmacySettings) => void;
}) {
  const [form, setForm] = useState<PharmacySettings>(settings);
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave(form);
      localStorage.setItem("pharmacySettings", JSON.stringify(form));
      toast.success("সেটিং সেভ হয়েছে");
      setSaving(false);
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl overflow-hidden shadow-sm border border-border">
        <div
          className="px-6 py-4 text-white font-bold text-lg"
          style={{ backgroundColor: "#0F3A3D" }}
        >
          ⚙️ সেটিং
        </div>
        <div className="bg-card p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              লোগো আপলোড
            </Label>
            <div className="flex items-center gap-5">
              <img
                src={form.logoUrl}
                alt="লোগো প্রিভিউ"
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
                data-ocid="settings.logo.preview"
              />
              <div>
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: "#1F6D63" }}
                  data-ocid="settings.upload_button"
                >
                  📁 লোগো পরিবর্তন করুন
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, GIF সমর্থিত
                </p>
              </div>
            </div>
          </div>

          {/* Pharmacy Name */}
          <div>
            <Label htmlFor="pname" className="text-sm font-semibold mb-1 block">
              প্রতিষ্ঠানের নাম
            </Label>
            <Input
              id="pname"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="প্রতিষ্ঠানের নাম লিখুন"
              data-ocid="settings.name.input"
            />
          </div>

          {/* Address */}
          <div>
            <Label
              htmlFor="paddress"
              className="text-sm font-semibold mb-1 block"
            >
              ঠিকানা
            </Label>
            <Input
              id="paddress"
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="ঠিকানা লিখুন"
              data-ocid="settings.address.input"
            />
          </div>

          {/* Email */}
          <div>
            <Label
              htmlFor="pemail"
              className="text-sm font-semibold mb-1 block"
            >
              ইমেইল আইডি
            </Label>
            <Input
              id="pemail"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="ইমেইল লিখুন"
              data-ocid="settings.email.input"
            />
          </div>

          {/* Phone */}
          <div>
            <Label
              htmlFor="pphone"
              className="text-sm font-semibold mb-1 block"
            >
              মোবাইল নম্বর
            </Label>
            <Input
              id="pphone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="মোবাইল নম্বর লিখুন"
              data-ocid="settings.phone.input"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full text-white font-semibold"
            style={{ backgroundColor: "#0F3A3D" }}
            data-ocid="settings.save_button"
          >
            {saving ? "সেভ হচ্ছে..." : "💾 সেটিং সেভ করুন"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── About Page ──────────────────────────────────────────────────────────────

function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl overflow-hidden shadow-sm border border-border">
        <div
          className="px-6 py-4 text-white font-bold text-lg"
          style={{ backgroundColor: "#0F3A3D" }}
        >
          ℹ️ আমাদের সম্পর্কে
        </div>
        <div className="bg-card p-8 text-center space-y-4">
          <img
            src="/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg"
            alt="লোগো"
            className="w-24 h-24 rounded-full object-cover mx-auto border-4"
            style={{ borderColor: "#0F3A3D" }}
          />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F3A3D" }}>
              সাওম ফার্মেসি
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              বালিগাঁও, লাখাই, হবিগঞ্জ
            </p>
          </div>
          <p className="text-base leading-relaxed text-foreground max-w-md mx-auto">
            সাওম ফার্মেসি একটি পেশাদার ফার্মেসি ম্যানেজমেন্ট সিস্টেম যা গ্রামীণ ফার্মেসির জন্য
            তৈরি। এটি স্টক ম্যানেজমেন্ট, বিক্রয় ট্র্যাকিং, বকেয়া হিসাব, আয়-ব্যয় ট্র্যাকিং সহ
            সকল প্রয়োজনীয় সুবিধা প্রদান করে।
          </p>
          <div
            className="rounded-lg p-4 text-sm space-y-1 text-left inline-block"
            style={{ backgroundColor: "#0F3A3D10" }}
          >
            <p>
              <span className="font-semibold">সংস্করণ:</span> ১০.০
            </p>
            <p>
              <span className="font-semibold">অবস্থান:</span> বালিগাঁও, লাখাই, হবিগঞ্জ
            </p>
            <p>
              <span className="font-semibold">বৈশিষ্ট্য:</span> অফলাইন + অনলাইন
              সমর্থন
            </p>
            <p>
              <span className="font-semibold">প্ল্যাটফর্ম:</span> Caffeine.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pharmacySettings, setPharmacySettings] =
    useState<PharmacySettings>(getPharmacyInfo);
  const { actor } = useActor();

  const [medicines, setMedicines] = useState<MedicineRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [dueRecords, setDueRecords] = useState<DueRecord[]>([]);
  const [nearExpiry, setNearExpiry] = useState<MedicineRecord[]>([]);
  const [lowStock, setLowStock] = useState<MedicineRecord[]>([]);

  const loadAll = useCallback(async () => {
    if (!actor) return;
    try {
      const [meds, sls, purs, dues, expiry, low] = await Promise.all([
        actor.getAllMedicines(),
        actor.getAllSales(),
        actor.getAllPurchases(),
        actor.getAllDueRecords(),
        actor.getMedicinesNearExpiry(BigInt(30)),
        actor.getLowStockMedicines(),
      ]);
      setMedicines(meds);
      setSales(sls);
      setPurchases(purs);
      setDueRecords(dues);
      setNearExpiry(expiry);
      setLowStock(low);
    } catch (e) {
      toast.error(`ডেটা লোড করতে ব্যর্থ: ${String(e)}`);
    }
  }, [actor]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
    >
      <Toaster richColors position="top-right" />

      <Sidebar
        current={page}
        onChange={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pharmacySettings={pharmacySettings}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 no-print flex-shrink-0">
          <button
            type="button"
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
            data-ocid="nav.menu.button"
          >
            <Menu size={22} />
          </button>
          <img
            src={pharmacySettings.logoUrl}
            alt="লোগো"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <h1 className="font-bold text-lg" style={{ color: "#0F3A3D" }}>
            {pharmacySettings.name}
          </h1>
          <span className="text-xs text-muted-foreground ml-auto">
            {pharmacySettings.address}
          </span>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {page === "dashboard" && (
            <Dashboard
              medicines={medicines}
              sales={sales}
              dueRecords={dueRecords}
              nearExpiry={nearExpiry}
              lowStock={lowStock}
            />
          )}
          {page === "medicines" && (
            <MedicinesPage
              medicines={medicines}
              onRefresh={loadAll}
              actor={actor}
            />
          )}

          {page === "purchases" && (
            <PurchasesPage
              medicines={medicines}
              purchases={purchases}
              onRefresh={loadAll}
              actor={actor}
            />
          )}
          {page === "due" && (
            <SalesPage
              medicines={medicines}
              sales={sales}
              onRefresh={loadAll}
              actor={actor}
            />
          )}
          {page === "dueledger" && (
            <DueKhataPage
              medicines={medicines}
              dueRecords={dueRecords}
              onRefresh={loadAll}
              actor={actor}
            />
          )}
          {page === "reports" && (
            <ReportsPage sales={sales} purchases={purchases} />
          )}
          {page === "income" && <IncomePage />}
          {page === "expense" && <ExpensePage />}
          {page === "settings" && (
            <SettingsPage
              settings={pharmacySettings}
              onSave={(s) => {
                setPharmacySettings(s);
                localStorage.setItem("pharmacySettings", JSON.stringify(s));
              }}
            />
          )}
          {page === "about" && <AboutPage />}
        </main>
      </div>
    </div>
  );
}
