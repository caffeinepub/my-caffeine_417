# সাওম ফার্মেসি - v25

## Current State
- Sales page (page id: `due`) has customer info fields, medicine rows, payment status, extra service charges section
- Menu has 10 items: dashboard, medicines, purchases, due (বিক্রয়), dueledger, income, expense, reports, settings, about
- SaleRecord type stored in backend has: id, medicineId, medicineName, brand, quantity, unitPrice, totalPrice, customerName, date, invoiceNumber, notes
- Extra sales data (diagnosis, doctor, healthNotes) will be stored in localStorage per invoice number

## Requested Changes (Diff)

### Add
1. **Sales form — new patient info fields** (stored in localStorage keyed by invoiceNumber):
   - রোগ নির্ণয় / সমস্যার বিবরণ (diagnosis) — text input, examples: জ্বর, মাথাব্যথা, ডায়াবেটিস
   - ডাক্তারের নাম / প্রেসক্রিপশন রেফারেন্স (doctorName + prescriptionRef) — text inputs
   - রোগীর স্বাস্থ্য নোট (healthNotes) — textarea, for special conditions like diabetes, pregnancy, child, allergy
2. **Medicine History tab in sales** — when customer name+mobile is entered, show their previous purchase history from localStorage
3. **New menu item: "রোগীর রেকর্ড"** (page id: `patientrecord`) — between reports and settings in the nav, color: Deep Teal (#0F766E), icon: FileText
4. **PatientRecordPage** — search by patient name or mobile number, shows complete history: name, address, diagnosis, medicine list, date, total cost. Print/PDF support.

### Modify
- Sales form: add new section "রোগীর তথ্য (ডিজিটাল রেকর্ড)" with the new fields after customer details section
- `handleSubmit` in SalesPage: save patient record data to localStorage key `pharma_patient_records` as array of objects with invoiceNumber, customerName, mobile, village, neighborhood, fatherName, diagnosis, doctorName, prescriptionRef, healthNotes, date, medicines, totalAmount
- Page type union: add `patientrecord`
- Nav items: add patient record item
- App routing: render PatientRecordPage when page === 'patientrecord'

### Remove
- Nothing removed

## Implementation Plan
1. Add `patientrecord` to Page type
2. Add nav item for রোগীর রেকর্ড (FileText icon, Deep Teal color) — insert after reports
3. In SalesPage: add state for diagnosis, doctorName, prescriptionRef, healthNotes
4. Add new form section in SalesPage UI with those 4 fields (premium colors + icons)
5. In handleSubmit: save full patient record to localStorage `pharma_patient_records`
6. Add medicine history display in SalesPage — when customerName+mobile filled, show past records
7. Build PatientRecordPage component with search by name/mobile, table of results, printable patient report
8. Wire new page in App routing
