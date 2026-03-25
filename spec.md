# সাওম ফার্মেসি

## Current State
- Dashboard component shows KPI cards, low stock alert, and recent sales table.
- IncomePage (standalone) has: date, amount, description fields; IncomeRecord has {id, date, amount, description}.
- ExpensePage (standalone) has: date, amount, description fields; ExpenseRecord has {id, date, amount, description}.
- Neither income nor expense records have a category field.

## Requested Changes (Diff)

### Add
- `category` field to IncomeRecord type and ExpenseRecord type (stored in localStorage).
- Predefined income categories: ঔষধ বিক্রি বাবদ টাকা | ইনজেকশন পুশিং চার্জ | ব্যান্ডেজ চার্জ | শিলায় বাবদ চার্জ
- Predefined expense categories: ঔষধ ক্রয় বাবদ টাকা | ওষুধ আনতে গিয়ে গাড়ি ভাড়া | লোডিং খরচ | আনলোডিং খরচ
- Two new tabs inside the Dashboard component: "আয়" (income) and "ব্যয়" (expense).
  - Each tab shows a summary card per category (icon + label + total amount).
  - Each tab shows a quick-add form (date, category dropdown, amount, optional description).
  - Each tab shows a table of recent entries for that category.
  - Grand total card at top of each tab.
  - আয় tab uses Turquoise (#06B6D4) premium color; ব্যয় tab uses Amber (#F59E0B) premium color.
  - Icons: TrendingUp for আয়, TrendingDown for ব্যয়. Category icons: Pill, Syringe/Activity, Bandage/HeartPulse, FlaskConical for income; ShoppingBag, Car/Truck, Package, PackageOpen for expense.
  - Tab header: আয় in turquoise with TrendingUp icon, ব্যয় in amber with TrendingDown icon.

### Modify
- Dashboard component: wrap existing content in a "সারসংক্ষেপ" (Overview) tab; add আয় and ব্যয় tabs alongside it.
- IncomePage: add category dropdown (same 4 income categories) to the entry form; display category column in table.
- ExpensePage: add category dropdown (same 4 expense categories) to the entry form; display category column in table.
- Both pages must use same localStorage keys (incomeRecords, expenseRecords) with backward-compatible category field (default to first category if missing).

### Remove
- Nothing removed.

## Implementation Plan
1. Update IncomeRecord and ExpenseRecord types to add optional `category?: string`.
2. Add INCOME_CATEGORIES and EXPENSE_CATEGORIES constant arrays.
3. Modify Dashboard props to accept incomeRecords and expenseRecords arrays (read from localStorage inside Dashboard or passed from parent).
4. Inside Dashboard, add Tabs: সারসংক্ষেপ | আয় | ব্যয়. Wrap existing KPI/low-stock/recent-sales content under সারসংক্ষেপ tab.
5. আয় tab: category summary cards (turquoise), quick-add form, recent entries table.
6. ব্যয় tab: category summary cards (amber), quick-add form, recent entries table.
7. Dashboard reads incomeRecords and expenseRecords from localStorage directly (no prop passing needed since Dashboard is a pure display component; it can manage its own state for these).
8. Update IncomePage category dropdown with 4 predefined income categories.
9. Update ExpensePage category dropdown with 4 predefined expense categories.
10. Pass incomeRecords and expenseRecords to Dashboard from App component, or have Dashboard read from localStorage with useState.
