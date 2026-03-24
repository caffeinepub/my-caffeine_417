# সাওম ফার্মেসি

## Current State
- MedicinesPage has a "নতুন ওষুধ" button that opens an add/edit dialog for medicine stock.
- PurchasesPage allows purchasing existing medicines from a dropdown, with fields: medicine select, quantity, unit price, supplier name.
- The purchase form does NOT support creating new medicines—medicines must exist before purchasing.

## Requested Changes (Diff)

### Add
- PurchasesPage: New full-featured purchase form with fields: ঔষধের নাম (text input with autocomplete for existing), Strength/Size, ব্র্যান্ড, ধরন (Tablet/Syrup/Capsule/etc.), Quantity + Unit dropdown, ক্রয়মূল্য, বিক্রয়মূল্য, Supplier নাম, মেয়াদ উত্তীর্ণ তারিখ, সর্বনিম্ন স্টক সতর্কতা.
- Purchase logic: if medicine with same name already exists → update its quantity (add purchased qty) and update prices/expiry; if new medicine → call addMedicine first, then createPurchase.
- Purchase history table: add Supplier column group/filter if viewing by supplier.

### Modify
- MedicinesPage: Remove the "নতুন ওষুধ" add button (and openAdd call). Keep the edit/delete functionality. The Dialog for editing still works; just disable opening it for new records (remove the add flow entirely from this page).
- PurchasesPage: Completely replace the minimal form with the full purchase entry form described above.

### Remove
- The ability to add a new medicine from MedicinesPage ("নতুন ওষুধ" button removed). New medicines only enter via the ক্রয় form.

## Implementation Plan
1. In MedicinesPage: remove the "নতুন ওষুধ" Button and openAdd function. Keep the edit dialog and editRecord flow intact.
2. Rewrite PurchasesPage:
   - Local state for all form fields: medicineName (text), strength, strengthUnit, brand, itemType, quantity, quantityUnit, costPrice, sellingPrice, supplier, expiryDate, minStockAlert.
   - Medicine name autocomplete: show suggestions from existing medicines as user types.
   - When medicine name matches existing: pre-fill brand/type/prices/strength.
   - On submit:
     a. Find if medicine exists by name match.
     b. If exists: update it (add qty, update prices/expiry if changed), then createPurchase with its id.
     c. If new: call addMedicine with all fields, then createPurchase with returned id.
   - History table shows all purchases with medicineName, supplier, qty, unit price, total, date.
