# সাওম ফার্মেসি

## Current State
ক্রয় (Purchase) পেজে সরবরাহকারীর শুধু নাম (supplierName) সংরক্ষণ হয়। PurchaseRecord backend type-এ supplierAddress বা supplierMobile ফিল্ড নেই। কোনো PDF export নেই।

## Requested Changes (Diff)

### Add
- PurchasesPage-এ দুটি নতুন ফিল্ড: সরবরাহকারীর ঠিকানা (supplierAddress) এবং মোবাইল নম্বর (supplierMobile)
- localStorage-এ `supplierDirectory` নামে একটি সরবরাহকারী ডিরেক্টরি রাখা হবে (key: supplierName → {address, mobile})
- সরবরাহকারীর নাম টাইপ করলে অটো-ফিল হবে (যদি আগে সেভ করা থাকে)
- ক্রয় সাবমিট করলে supplierAddress ও supplierMobile localStorage-এ সেভ হবে
- PDF অর্ডার শীট এক্সপোর্ট বাটন: নির্দিষ্ট সরবরাহকারীর নামে ফিল্টার করে PDF তৈরি করা যাবে
  - PDF header: ফার্মেসির নাম, ঠিকানা, লোগো (pharmacySettings থেকে)
  - To: সরবরাহকারীর নাম, ঠিকানা, মোবাইল
  - অর্ডার টেবিল: ঔষধের নাম, পরিমাণ, ইউনিট মূল্য, মোট
  - Footer: মোট টাকা, তারিখ
- ক্রয় ইতিহাস টেবিলে সরবরাহকারীর মোবাইল কলামও দেখাবে

### Modify
- PurchasesPage: supplier state-এ address ও mobile যোগ, handleSubmit-এ localStorage supplier directory আপডেট, reset-এ নতুন ফিল্ড পরিষ্কার

### Remove
- কিছু সরানো হবে না

## Implementation Plan
1. `getSupplierDirectory()` / `saveSupplierToDirectory()` হেল্পার ফাংশন (localStorage)
2. PurchasesPage-এ `supplierAddress`, `supplierMobile` state যোগ
3. supplier নাম পরিবর্তনে অটো-ফিল লজিক
4. handleSubmit-এ localStorage আপডেট
5. ফর্মে দুটি নতুন ফিল্ড (ঠিকানা, মোবাইল)
6. `exportOrderSheetPDF(supplierName, purchases, pharmacySettings)` ফাংশন — window.print বা jsPDF ব্যবহার করে PDF তৈরি (jsPDF+autoTable)
7. ক্রয় ইতিহাস টেবিলে মোবাইল কলাম যোগ এবং সরবরাহকারীভিত্তিক ফিল্টার + এক্সপোর্ট বাটন
