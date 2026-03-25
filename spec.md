# সাওম ফার্মেসি

## Current State
- ক্রয় (Purchase) পেজে শুধু ঔষধ ক্রয় এন্ট্রি ফর্ম আছে — গাড়ি ভাড়া, লোডিং/আনলোডিং খরচ নেই।
- বিক্রয় (Sales) পেজে শুধু ঔষধ বিক্রয় ফর্ম আছে — ইনজেকশন পুশিং চার্জ, ব্যান্ডেজ চার্জ, সেলাই চার্জ নেই।

## Requested Changes (Diff)

### Add
- ক্রয় পেজে আলাদা একটি section/card যেখানে অতিরিক্ত খরচ এন্ট্রি করা যাবে:
  - গাড়ি ভাড়া (icon: Car/Truck, deep orange color)
  - লোডিং খরচ (icon: Package/ArrowUp, teal color)
  - আনলোডিং খরচ (icon: PackageOpen/ArrowDown, indigo color)
  - প্রতিটি ফিল্ডে টাকার পরিমাণ ও তারিখ ইনপুট থাকবে
  - সংরক্ষণ হবে localStorage-এ
  - ইতিহাস টেবিলে দেখাবে
- বিক্রয় পেজে আলাদা একটি section/card যেখানে অতিরিক্ত সেবা চার্জ এন্ট্রি করা যাবে:
  - ইনজেকশন পুশিং চার্জ (icon: Syringe, emerald color)
  - ব্যান্ডেজ চার্জ (icon: Heart/Shield, rose color)
  - সেলাই চার্জ (icon: Scissors, violet color)
  - প্রতিটি ফিল্ডে টাকার পরিমাণ, রোগীর নাম (optional), তারিখ ইনপুট থাকবে
  - সংরক্ষণ হবে localStorage-এ
  - ইতিহাস টেবিলে দেখাবে

### Modify
- ক্রয় পেজে: মূল ঔষধ ক্রয় ফর্মের পরে নতুন section যোগ করা হবে
- বিক্রয় পেজে: মূল ঔষধ বিক্রয় ফর্মের পরে নতুন section যোগ করা হবে

### Remove
- কিছু সরানো হবে না

## Implementation Plan
1. PurchasesPage-এ নতুন `ExtraCostsSection` যোগ করো — গাড়ি ভাড়া, লোডিং খরচ, আনলোডিং খরচ — প্রতিটির জন্য premium color + icon, amount input, date, save বাটন, এবং history table। localStorage ব্যবহার করো।
2. SalesPage-এ নতুন `ExtraChargesSection` যোগ করো — ইনজেকশন পুশিং চার্জ, ব্যান্ডেজ চার্জ, সেলাই চার্জ — প্রতিটির জন্য premium color + icon, amount input, patient name (optional), date, save বাটন, এবং history table। localStorage ব্যবহার করো।
3. প্রতিটি column/field এর label আলাদা premium color-এ থাকবে এবং সামনে matching color-এর icon থাকবে।
4. Design: modern, minimal, professional — card layout with colored headers।
