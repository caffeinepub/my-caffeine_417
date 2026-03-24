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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Pencil,
  Phone,
  Pill,
  Plus,
  Printer,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
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
  | "sales"
  | "purchases"
  | "due"
  | "reports"
  | "income"
  | "expense";

const PHARMACY_NAME = "সাওম ফার্মেসি";
const PHARMACY_ADDRESS = "বালিগাঁও, লাখাই, হবিগঞ্জ";
const PHARMACY_PHONE = "01XXXXXXXXX";

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

function getItemTypes(): string[] {
  const base = ["ট্যাবলেট", "ক্যাপসুল", "সিরাপ", "ইনজেকশন", "অন্যান্য"];
  const custom = JSON.parse(localStorage.getItem("customItemTypes") || "[]");
  return [...base, ...custom];
}

function addCustomItemType(type: string) {
  const existing = JSON.parse(localStorage.getItem("customItemTypes") || "[]");
  if (!existing.includes(type)) {
    localStorage.setItem(
      "customItemTypes",
      JSON.stringify([...existing, type]),
    );
  }
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

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "ড্যাশবোর্ড", icon: <LayoutDashboard size={18} /> },
  { id: "medicines", label: "ওষুধ স্টক", icon: <Pill size={18} /> },
  { id: "sales", label: "বিক্রয়", icon: <ShoppingCart size={18} /> },
  { id: "purchases", label: "ক্রয়", icon: <PackageSearch size={18} /> },
  { id: "due", label: "বকেয়া লিস্ট", icon: <ClipboardList size={18} /> },
  { id: "income", label: "আয়", icon: <TrendingUp size={18} /> },
  { id: "expense", label: "ব্যয়", icon: <TrendingDown size={18} /> },
  { id: "reports", label: "রিপোর্ট", icon: <BarChart3 size={18} /> },
];

function Sidebar({
  current,
  onChange,
  open,
  onClose,
}: {
  current: Page;
  onChange: (p: Page) => void;
  open: boolean;
  onClose: () => void;
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
            src="/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg"
            alt="লোগো"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 mr-3"
          />
          <div>
            <div className="text-white font-bold text-lg leading-tight">
              {PHARMACY_NAME}
            </div>
            <div className="text-white/60 text-xs mt-0.5">
              {PHARMACY_ADDRESS}
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  current === item.id
                    ? "text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              style={current === item.id ? { backgroundColor: "#1F6D63" } : {}}
            >
              {item.icon}
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>

      {/* KPI Cards */}
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
              <p className="font-bold text-lg leading-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
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

        {/* Recent Sales */}
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

  function openAdd() {
    setEditRecord(null);
    setForm(emptyMedForm());
    setOpen(true);
  }

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
        <Button
          data-ocid="medicines.add_button"
          onClick={openAdd}
          style={{ backgroundColor: "#1F6D63" }}
        >
          <Plus size={16} className="mr-1" /> নতুন ওষুধ
        </Button>
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
  const [medId, setMedId] = useState("");
  const [qty, setQty] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [printSale, setPrintSale] = useState<SaleRecord | null>(null);

  const selectedMed = medicines.find((m) => String(m.id) === medId);
  const unitPrice = selectedMed ? Number(selectedMed.sellingPrice) : 0;
  const total = unitPrice * (Number.parseInt(qty) || 0);

  async function handleSubmit() {
    if (!medId) {
      toast.error("ওষুধ বেছে নিন");
      return;
    }
    if (!qty || Number.parseInt(qty) <= 0) {
      toast.error("পরিমাণ দিন");
      return;
    }
    if (!selectedMed) return;
    if (Number(selectedMed.quantity) < Number.parseInt(qty)) {
      toast.error("পর্যাপ্ত স্টক নেই");
      return;
    }
    setSaving(true);
    try {
      const invoiceNumber = BigInt(Date.now());
      const saleRecord: SaleRecord = {
        id: BigInt(0),
        medicineId: selectedMed.id,
        medicineName: selectedMed.name,
        brand: selectedMed.brand,
        quantity: BigInt(Number.parseInt(qty)),
        unitPrice: selectedMed.sellingPrice,
        totalPrice: BigInt(total),
        customerName: customerName.trim() || undefined,
        date: nowNano(),
        invoiceNumber,
        notes: undefined,
      };
      await actor?.createSale(saleRecord);
      // Update stock
      const updated: MedicineRecord = {
        ...selectedMed,
        quantity: selectedMed.quantity - BigInt(Number.parseInt(qty)),
      };
      await actor?.updateMedicine(selectedMed.id, updated);
      toast.success("বিক্রয় সম্পন্ন হয়েছে");
      setMedId("");
      setQty("1");
      setCustomerName("");
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function handlePrint(sale: SaleRecord) {
    setPrintSale(sale);
    setTimeout(() => window.print(), 300);
  }

  const sortedSales = [...sales].sort((a, b) => Number(b.date - a.date));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">বিক্রয়</h1>

      {/* Sale Form */}
      <div className="bg-card rounded-lg shadow-card p-5">
        <h2 className="font-semibold mb-4">নতুন বিক্রয়</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Label>ওষুধ বেছে নিন</Label>
            <Select value={medId} onValueChange={setMedId}>
              <SelectTrigger data-ocid="sales.select">
                <SelectValue placeholder="ওষুধ নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((m) => (
                  <SelectItem key={String(m.id)} value={String(m.id)}>
                    {m.name} ({m.brand}) - স্টক: {String(m.quantity)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>পরিমাণ</Label>
            <Input
              data-ocid="sales.input"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <Label>একক মূল্য</Label>
            <Input readOnly value={taka(unitPrice)} className="bg-muted" />
          </div>
          <div>
            <Label>কাস্টমার নাম (ঐচ্ছিক)</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="কাস্টমারের নাম"
            />
          </div>
          <div>
            <Label>মোট</Label>
            <Input
              readOnly
              value={taka(total)}
              className="bg-muted font-bold"
            />
          </div>
          <div className="flex items-end">
            <Button
              data-ocid="sales.submit_button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full"
              style={{ backgroundColor: "#1F6D63" }}
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : "বিক্রয় নিশ্চিত করুন"}
            </Button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ইনভয়েস#</TableHead>
              <TableHead>ওষুধ</TableHead>
              <TableHead>পরিমাণ</TableHead>
              <TableHead>একক মূল্য</TableHead>
              <TableHead>মোট</TableHead>
              <TableHead>কাস্টমার</TableHead>
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
              <TableRow key={String(s.id)} data-ocid={`sales.item.${i + 1}`}>
                <TableCell className="font-mono text-xs">
                  {String(s.invoiceNumber).slice(-6)}
                </TableCell>
                <TableCell>{s.medicineName}</TableCell>
                <TableCell>{String(s.quantity)}</TableCell>
                <TableCell>{taka(Number(s.unitPrice))}</TableCell>
                <TableCell className="font-semibold">
                  {taka(Number(s.totalPrice))}
                </TableCell>
                <TableCell>{s.customerName || "—"}</TableCell>
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
      {printSale && (
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
              {PHARMACY_NAME}
            </h1>
            <p style={{ fontSize: 13 }}>{PHARMACY_ADDRESS}</p>
            <p style={{ fontSize: 13 }}>ফোন: {PHARMACY_PHONE}</p>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            ইনভয়েস
          </h2>
          <p>তারিখ: {formatDate(printSale.date)}</p>
          <p>কাস্টমার: {printSale.customerName || "—"}</p>
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc" }}>
                <th style={{ textAlign: "left", padding: 4 }}>ওষুধ</th>
                <th style={{ textAlign: "right", padding: 4 }}>পরিমাণ</th>
                <th style={{ textAlign: "right", padding: 4 }}>একক মূল্য</th>
                <th style={{ textAlign: "right", padding: 4 }}>মোট</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 4 }}>
                  {printSale.medicineName} ({printSale.brand})
                </td>
                <td style={{ textAlign: "right", padding: 4 }}>
                  {String(printSale.quantity)}
                </td>
                <td style={{ textAlign: "right", padding: 4 }}>
                  {taka(Number(printSale.unitPrice))}
                </td>
                <td style={{ textAlign: "right", padding: 4 }}>
                  {taka(Number(printSale.totalPrice))}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #0F3A3D" }}>
                <td
                  colSpan={3}
                  style={{ textAlign: "right", padding: 4, fontWeight: 700 }}
                >
                  মোট বিল:
                </td>
                <td style={{ textAlign: "right", padding: 4, fontWeight: 700 }}>
                  {taka(Number(printSale.totalPrice))}
                </td>
              </tr>
            </tfoot>
          </table>
          <p
            style={{
              marginTop: 24,
              fontSize: 12,
              textAlign: "center",
              color: "#666",
            }}
          >
            ধন্যবাদ আপনাকে!
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Purchases Page ──────────────────────────────────────────────────────────

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
  const [medId, setMedId] = useState("");
  const [qty, setQty] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedMed = medicines.find((m) => String(m.id) === medId);
  const total =
    (Number.parseFloat(unitPrice) || 0) * (Number.parseInt(qty) || 0);

  async function handleSubmit() {
    if (!medId) {
      toast.error("ওষুধ বেছে নিন");
      return;
    }
    if (!qty || Number.parseInt(qty) <= 0) {
      toast.error("পরিমাণ দিন");
      return;
    }
    if (!selectedMed) return;
    setSaving(true);
    try {
      const record: PurchaseRecord = {
        id: BigInt(0),
        medicineId: selectedMed.id,
        medicineName: selectedMed.name,
        quantity: BigInt(Number.parseInt(qty)),
        unitPrice: BigInt(Math.round(Number.parseFloat(unitPrice) || 0)),
        totalPrice: BigInt(Math.round(total)),
        supplierName: supplierName.trim(),
        date: nowNano(),
      };
      await actor?.createPurchase(record);
      // Update stock
      const updated: MedicineRecord = {
        ...selectedMed,
        quantity: selectedMed.quantity + BigInt(Number.parseInt(qty)),
      };
      await actor?.updateMedicine(selectedMed.id, updated);
      toast.success("ক্রয় সম্পন্ন হয়েছে");
      setMedId("");
      setQty("1");
      setUnitPrice("");
      setSupplierName("");
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ক্রয়</h1>

      <div className="bg-card rounded-lg shadow-card p-5">
        <h2 className="font-semibold mb-4">নতুন ক্রয়</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Label>ওষুধ বেছে নিন</Label>
            <Select value={medId} onValueChange={setMedId}>
              <SelectTrigger data-ocid="purchases.select">
                <SelectValue placeholder="ওষুধ নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((m) => (
                  <SelectItem key={String(m.id)} value={String(m.id)}>
                    {m.name} ({m.brand})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>পরিমাণ</Label>
            <Input
              data-ocid="purchases.input"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <Label>একক ক্রয়মূল্য (৳)</Label>
            <Input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          <div>
            <Label>সরবরাহকারী</Label>
            <Input
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="সরবরাহকারীর নাম"
            />
          </div>
          <div>
            <Label>মোট</Label>
            <Input
              readOnly
              value={taka(total)}
              className="bg-muted font-bold"
            />
          </div>
          <div className="flex items-end">
            <Button
              data-ocid="purchases.submit_button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full"
              style={{ backgroundColor: "#1F6D63" }}
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : "ক্রয় নিশ্চিত করুন"}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>ওষুধ</TableHead>
              <TableHead>পরিমাণ</TableHead>
              <TableHead>একক মূল্য</TableHead>
              <TableHead>মোট</TableHead>
              <TableHead>সরবরাহকারী</TableHead>
              <TableHead>তারিখ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPurchases.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                <TableCell>{formatDate(p.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Due Records Page ────────────────────────────────────────────────────────

type DueLineItem = {
  id: string;
  itemType: string;
  medicineId: string;
  quantity: string;
  quantityUnit: string;
};

type DueForm = {
  village: string;
  neighborhood: string;
  customerName: string;
  fatherName: string;
  mobile: string;
  lineItems: DueLineItem[];
  status: string;
};

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

const emptyLineItem = (): DueLineItem => ({
  id: Math.random().toString(36).slice(2),
  itemType: "ট্যাবলেট",
  medicineId: "",
  quantity: "1",
  quantityUnit: "Piece",
});

const emptyDueForm = (): DueForm => ({
  village: "বালিগাঁও",
  neighborhood: "",
  customerName: "",
  fatherName: "",
  mobile: "",
  lineItems: [emptyLineItem()],
  status: "Due",
});

function DuePage({
  medicines,
  dueRecords,
  onRefresh,
  actor,
}: {
  medicines: MedicineRecord[];
  dueRecords: DueRecord[];
  onRefresh: () => void;
  actor: backendInterface | null;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DueForm>(emptyDueForm());
  const [statusFilter, setStatusFilter] = useState("all");
  const [villageFilter, setVillageFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [itemTypes, setItemTypes] = useState<string[]>(getItemTypes());
  const [newTypeInput, setNewTypeInput] = useState("");
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [dueQtyUnits, setDueQtyUnits] = useState<string[]>(getQtyUnits());
  const [showUnitMgr, setShowUnitMgr] = useState(false);
  const [newUnitInput, setNewUnitInput] = useState("");
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editUnitVal, setEditUnitVal] = useState("");

  const neighborhoods = VILLAGES[form.village] || [];

  // Filter neighborhoods for filter bar
  const filterNeighborhoods =
    villageFilter !== "all" ? VILLAGES[villageFilter] || [] : [];

  const groups = groupDueRecords(dueRecords);

  const filteredGroups = groups.filter((g) => {
    if (villageFilter !== "all" && g.village !== villageFilter) return false;
    if (neighborhoodFilter !== "all" && g.neighborhood !== neighborhoodFilter)
      return false;
    if (statusFilter === "Due" && g.status !== "Due") return false;
    if (statusFilter === "Paid" && g.status !== "Paid") return false;
    return true;
  });

  function updateLineItem(idx: number, patch: Partial<DueLineItem>) {
    setForm((prev) => {
      const lineItems = prev.lineItems.map((li, i) => {
        if (i !== idx) return li;
        const updated = { ...li, ...patch };
        // reset medicine if itemType changed
        if (patch.itemType && patch.itemType !== li.itemType) {
          updated.medicineId = "";
        }
        return updated;
      });
      return { ...prev, lineItems };
    });
  }

  function addLineItem() {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, emptyLineItem()],
    }));
  }

  function removeLineItem(idx: number) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== idx),
    }));
  }

  function handleAddCustomType() {
    const t = newTypeInput.trim();
    if (!t) return;
    addCustomItemType(t);
    const updated = getItemTypes();
    setItemTypes(updated);
    setNewTypeInput("");
    setShowNewTypeInput(false);
    toast.success(`"${t}" যুক্ত হয়েছে`);
  }

  function handleAddDueUnit() {
    const v = newUnitInput.trim();
    if (!v) return;
    saveQtyUnit(v);
    setDueQtyUnits(getQtyUnits());
    setNewUnitInput("");
    toast.success(`"${v}" যুক্ত হয়েছে`);
  }
  function handleDeleteDueUnit(u: string) {
    deleteQtyUnit(u);
    setDueQtyUnits(getQtyUnits());
  }
  function handleEditDueUnit() {
    if (!editingUnit || !editUnitVal.trim()) return;
    editQtyUnit(editingUnit, editUnitVal.trim());
    setDueQtyUnits(getQtyUnits());
    setEditingUnit(null);
    setEditUnitVal("");
  }

  async function handleSave() {
    if (!form.customerName.trim()) {
      toast.error("কাস্টমারের নাম দিন");
      return;
    }
    const validItems = form.lineItems.filter((li) => li.medicineId);
    if (validItems.length === 0) {
      toast.error("অন্তত একটি ওষুধ বেছে নিন");
      return;
    }
    setSaving(true);
    try {
      const timestamp = nowNano();
      for (const item of validItems) {
        const med = medicines.find((m) => String(m.id) === item.medicineId);
        if (!med) continue;
        const qty = Number.parseInt(item.quantity) || 1;
        const record: DueRecord = {
          id: BigInt(0),
          village: form.village,
          neighborhood: form.neighborhood,
          customerName: form.customerName.trim(),
          fatherName: form.fatherName.trim(),
          mobile: form.mobile.trim(),
          itemType: item.itemType,
          medicineId: med.id,
          medicineName: med.name,
          quantity: BigInt(qty),
          unitPrice: med.sellingPrice,
          totalPrice: BigInt(Number(med.sellingPrice) * qty),
          status: form.status || "Due",
          date: timestamp,
        };
        await actor?.addDueRecord(record);
        // Store unit in localStorage for display
        const unitMap = JSON.parse(
          localStorage.getItem("pharma_due_units") || "{}",
        );
        unitMap[`${String(timestamp)}_${med.name}`] =
          item.quantityUnit || "Piece";
        localStorage.setItem("pharma_due_units", JSON.stringify(unitMap));
      }
      toast.success("বকেয়া যোগ হয়েছে");
      setOpen(false);
      setForm(emptyDueForm());
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkGroupPaid(group: DueGroup) {
    try {
      for (const item of group.items) {
        if (item.status === "Due") await actor?.markDueAsPaid(item.id);
      }
      toast.success("পরিশোধ হিসেবে চিহ্নিত");
      onRefresh();
    } catch (e) {
      toast.error(`ত্রুটি: ${String(e)}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">বকেয়া লিস্ট</h1>
        <Button
          data-ocid="due.add_button"
          onClick={() => {
            setForm(emptyDueForm());
            setItemTypes(getItemTypes());
            setOpen(true);
          }}
          style={{ backgroundColor: "#1F6D63" }}
        >
          <Plus size={16} className="mr-1" /> নতুন বকেয়া
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">গ্রাম</span>
          <Select
            value={villageFilter}
            onValueChange={(v) => {
              setVillageFilter(v);
              setNeighborhoodFilter("all");
            }}
          >
            <SelectTrigger className="w-36" data-ocid="due.village.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব গ্রাম</SelectItem>
              {Object.keys(VILLAGES).map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">পাড়া</span>
          <Select
            value={neighborhoodFilter}
            onValueChange={setNeighborhoodFilter}
            disabled={villageFilter === "all"}
          >
            <SelectTrigger className="w-44" data-ocid="due.neighborhood.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব পাড়া</SelectItem>
              {filterNeighborhoods.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">
            স্ট্যাটাস
          </span>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all" data-ocid="due.all.tab">
                সব
              </TabsTrigger>
              <TabsTrigger value="Due" data-ocid="due.pending.tab">
                বকেয়া
              </TabsTrigger>
              <TabsTrigger value="Paid" data-ocid="due.paid.tab">
                পরিশোধিত
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="ml-auto text-sm text-muted-foreground self-end pb-1">
          মোট:{" "}
          <span className="font-bold text-foreground">
            {filteredGroups.length}
          </span>{" "}
          গ্রাহক
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>গ্রাম / পাড়া</TableHead>
              <TableHead>কাস্টমার নাম / পিতা</TableHead>
              <TableHead>মোবাইল</TableHead>
              <TableHead>আইটেম ও পরিমাণ</TableHead>
              <TableHead>মোট দাম</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="due.empty_state"
                >
                  কোনো বকেয়া নেই।
                </TableCell>
              </TableRow>
            )}
            {filteredGroups.map((g, i) => (
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
                      <div key={String(it.id) + String(j)} className="text-sm">
                        <span className="font-medium">{it.medicineName}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({String(it.quantity)}{" "}
                          {getDueUnit(g.date, it.medicineName) || "টি"})
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {taka(g.totalPrice)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={g.status === "Paid" ? "default" : "destructive"}
                    className={g.status === "Paid" ? "bg-green-600" : ""}
                  >
                    {g.status === "Paid" ? "পরিশোধিত" : "বকেয়া"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {g.status === "Due" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 hover:bg-green-50"
                      data-ocid={`due.confirm_button.${i + 1}`}
                      onClick={() => handleMarkGroupPaid(g)}
                    >
                      <CheckCircle size={14} className="mr-1" /> পরিশোধ
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Due Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" data-ocid="due.dialog">
          <DialogHeader>
            <DialogTitle>নতুন বকেয়া যোগ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>গ্রাম</Label>
                <Select
                  value={form.village}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, village: v, neighborhood: "" }))
                  }
                >
                  <SelectTrigger data-ocid="due.form.village.select">
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
                <Select
                  value={form.neighborhood}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, neighborhood: v }))
                  }
                >
                  <SelectTrigger data-ocid="due.form.neighborhood.select">
                    <SelectValue placeholder="পাড়া বেছে নিন" />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>কাস্টমার নাম</Label>
                <Input
                  placeholder="নাম লিখুন"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customerName: e.target.value }))
                  }
                  data-ocid="due.customer_name.input"
                />
              </div>
              <div>
                <Label>পিতার নাম</Label>
                <Input
                  placeholder="পিতার নাম"
                  value={form.fatherName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fatherName: e.target.value }))
                  }
                  data-ocid="due.father_name.input"
                />
              </div>
              <div className="col-span-2">
                <Label>মোবাইল নম্বর</Label>
                <Input
                  placeholder="01XXXXXXXXX"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, mobile: e.target.value }))
                  }
                  data-ocid="due.mobile.input"
                />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">ওষুধ তালিকা</Label>
                <div className="flex items-center gap-2">
                  {!showNewTypeInput ? (
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => setShowNewTypeInput(true)}
                    >
                      + নতুন ধরন যোগ
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-7 text-xs w-28"
                        placeholder="ধরনের নাম"
                        value={newTypeInput}
                        onChange={(e) => setNewTypeInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddCustomType()
                        }
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={handleAddCustomType}
                        style={{ backgroundColor: "#1F6D63" }}
                      >
                        যোগ
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setShowNewTypeInput(false)}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-medium">
                        আইটেম
                      </th>
                      <th className="text-left px-2 py-1.5 font-medium">ওষুধ</th>
                      <th className="text-left px-2 py-1.5 font-medium">
                        পরিমাণ / ইউনিট
                      </th>
                      <th className="text-left px-2 py-1.5 font-medium w-20">
                        দাম
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems.map((li, idx) => {
                      const filteredMeds = medicines.filter(
                        (m) => m.itemType === li.itemType,
                      );
                      const selectedMed = medicines.find(
                        (m) => String(m.id) === li.medicineId,
                      );
                      const lineTotal = selectedMed
                        ? Number(selectedMed.sellingPrice) *
                          (Number.parseInt(li.quantity) || 0)
                        : 0;
                      return (
                        <tr key={li.id} className="border-t">
                          <td className="px-2 py-1.5">
                            <Select
                              value={li.itemType}
                              onValueChange={(v) =>
                                updateLineItem(idx, { itemType: v })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {itemTypes.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5">
                            <Select
                              value={li.medicineId}
                              onValueChange={(v) =>
                                updateLineItem(idx, { medicineId: v })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs w-48">
                                <SelectValue placeholder="ওষুধ বেছে নিন" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredMeds.length === 0 ? (
                                  <SelectItem value="_none" disabled>
                                    এই ধরনের ওষুধ নেই
                                  </SelectItem>
                                ) : (
                                  filteredMeds.map((m) => (
                                    <SelectItem
                                      key={String(m.id)}
                                      value={String(m.id)}
                                    >
                                      {m.name} ({m.brand}) -{" "}
                                      {taka(Number(m.sellingPrice))}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1 items-center">
                              <Input
                                type="number"
                                min="1"
                                className="h-8 text-xs w-14"
                                value={li.quantity}
                                onChange={(e) =>
                                  updateLineItem(idx, {
                                    quantity: e.target.value,
                                  })
                                }
                              />
                              <Select
                                value={li.quantityUnit}
                                onValueChange={(v) =>
                                  updateLineItem(idx, { quantityUnit: v })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {dueQtyUnits.map((u) => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {lineTotal > 0 ? taka(lineTotal) : "—"}
                          </td>
                          <td className="px-2 py-1.5">
                            {form.lineItems.length > 1 && (
                              <button
                                type="button"
                                className="text-destructive hover:text-red-700 text-xs"
                                onClick={() => removeLineItem(idx)}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={addLineItem}
                  data-ocid="due.add_line_button"
                >
                  <Plus size={12} className="mr-1" /> আইটেম যোগ করুন
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-muted-foreground"
                  onClick={() => setShowUnitMgr(true)}
                  data-ocid="due.unit_mgr_button"
                >
                  ইউনিট পরিচালনা
                </Button>
              </div>
            </div>

            {/* Total & Status */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>মোট দাম</Label>
                <Input
                  readOnly
                  value={taka(
                    form.lineItems.reduce((sum, li) => {
                      const med = medicines.find(
                        (m) => String(m.id) === li.medicineId,
                      );
                      return (
                        sum +
                        (med
                          ? Number(med.sellingPrice) *
                            (Number.parseInt(li.quantity) || 0)
                          : 0)
                      );
                    }, 0),
                  )}
                  className="bg-muted font-bold"
                />
              </div>
              <div>
                <Label>স্ট্যাটাস</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger data-ocid="due.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due">বকেয়া</SelectItem>
                    <SelectItem value="Paid">পরিশোধিত</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="due.cancel_button"
            >
              বাতিল
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              data-ocid="due.save_button"
              style={{ backgroundColor: "#1F6D63" }}
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : "যোগ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit Manager Dialog */}
      <Dialog open={showUnitMgr} onOpenChange={setShowUnitMgr}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ইউনিট পরিচালনা</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="নতুন ইউনিট (যেমন: Sachet)"
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddDueUnit()}
              />
              <Button
                size="sm"
                onClick={handleAddDueUnit}
                style={{ backgroundColor: "#1F6D63" }}
              >
                যোগ
              </Button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {dueQtyUnits.map((u) => (
                <div
                  key={u}
                  className="flex items-center gap-2 py-1 border-b last:border-0"
                >
                  {editingUnit === u ? (
                    <>
                      <Input
                        value={editUnitVal}
                        onChange={(e) => setEditUnitVal(e.target.value)}
                        className="h-7 text-sm flex-1"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleEditDueUnit()
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditDueUnit}
                      >
                        সেভ
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingUnit(null)}
                      >
                        বাতিল
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{u}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setEditingUnit(u);
                          setEditUnitVal(u);
                        }}
                      >
                        ✎
                      </Button>
                      {!["Piece", "Box", "Strip", "Bottle", "Pack"].includes(
                        u,
                      ) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-destructive"
                          onClick={() => handleDeleteDueUnit(u)}
                        >
                          ✕
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
            {PHARMACY_NAME}
          </h1>
          <p style={{ fontSize: 13 }}>
            {PHARMACY_ADDRESS} | ফোন: {PHARMACY_PHONE}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <TableCell colSpan={3} className="text-right">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <TableCell colSpan={3} className="text-right">
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

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
            src="/assets/uploads/screenshot_20260324_212053_contacts-019d2072-a244-71cf-a1f7-dc388bc496ed-1.jpg"
            alt="লোগো"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <h1 className="font-bold text-lg" style={{ color: "#0F3A3D" }}>
            {PHARMACY_NAME}
          </h1>
          <span className="text-xs text-muted-foreground ml-auto">
            {PHARMACY_ADDRESS}
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
          {page === "sales" && (
            <SalesPage
              medicines={medicines}
              sales={sales}
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
            <DuePage
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
        </main>
      </div>
    </div>
  );
}
