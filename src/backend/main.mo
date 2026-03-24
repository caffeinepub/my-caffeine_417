import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";

actor {
  module MedicineRecord {
    public func compare(m1 : MedicineRecord, m2 : MedicineRecord) : Order.Order {
      Text.compare(m1.name, m2.name);
    };

    public func compareByQuantity(m1 : MedicineRecord, m2 : MedicineRecord) : Order.Order {
      Nat.compare(m1.quantity, m2.quantity);
    };

    public func compareByExpiry(m1 : MedicineRecord, m2 : MedicineRecord) : Order.Order {
      Int.compare(m1.expiryDate, m2.expiryDate);
    };
  };

  module SaleRecord {
    public func compareByDate(s1 : SaleRecord, s2 : SaleRecord) : Order.Order {
      Int.compare(s1.date, s2.date);
    };
  };

  module PurchaseRecord {
    public func compareByDate(p1 : PurchaseRecord, p2 : PurchaseRecord) : Order.Order {
      Int.compare(p1.date, p2.date);
    };
  };

  module DueRecord {
    public func compare(d1 : DueRecord, d2 : DueRecord) : Order.Order {
      Text.compare(d1.customerName, d2.customerName);
    };

    public func compareByAmount(d1 : DueRecord, d2 : DueRecord) : Order.Order {
      Nat.compare(d1.totalPrice, d2.totalPrice);
    };
  };

  type MedicineRecord = {
    id : Nat;
    name : Text;
    brand : Text;
    itemType : Text;
    purchasePrice : Nat;
    sellingPrice : Nat;
    quantity : Nat;
    expiryDate : Time.Time;
    minStockAlert : Nat;
    createdAt : Time.Time;
  };

  type SaleRecord = {
    id : Nat;
    medicineId : Nat;
    medicineName : Text;
    brand : Text;
    quantity : Nat;
    unitPrice : Nat;
    totalPrice : Nat;
    date : Time.Time;
    invoiceNumber : Nat;
    customerName : ?Text;
    notes : ?Text;
  };

  type PurchaseRecord = {
    id : Nat;
    medicineId : Nat;
    medicineName : Text;
    quantity : Nat;
    unitPrice : Nat;
    totalPrice : Nat;
    date : Time.Time;
    supplierName : Text;
  };

  type DueRecord = {
    id : Nat;
    village : Text;
    neighborhood : Text;
    customerName : Text;
    fatherName : Text;
    mobile : Text;
    itemType : Text;
    medicineId : Nat;
    medicineName : Text;
    quantity : Nat;
    unitPrice : Nat;
    totalPrice : Nat;
    status : Text;
    date : Time.Time;
  };

  type ReportRecord = {
    month : ?Nat;
    year : Nat;
    totalSales : Nat;
    totalPurchases : Nat;
    profitLoss : Int;
  };

  let medicines = Map.empty<Nat, MedicineRecord>();
  let sales = Map.empty<Nat, SaleRecord>();
  let purchases = Map.empty<Nat, PurchaseRecord>();
  let dues = Map.empty<Nat, DueRecord>();

  var nextMedicineId = 1;
  var nextSaleId = 1;
  var nextPurchaseId = 1;
  var nextDueId = 1;
  var nextInvoiceNumber = 1;

  func getCurrentTime() : Time.Time {
    Time.now();
  };

  public shared ({ caller }) func addMedicine(input : MedicineRecord) : async Nat {
    let id = nextMedicineId;
    nextMedicineId += 1;

    let newRecord : MedicineRecord = {
      input with
      id;
      createdAt = getCurrentTime();
    };

    medicines.add(id, newRecord);
    id;
  };

  public shared ({ caller }) func updateMedicine(medicineId : Nat, input : MedicineRecord) : async () {
    let existing = switch (medicines.get(medicineId)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?found) { found };
    };

    let updatedRecord : MedicineRecord = {
      input with
      id = existing.id;
      createdAt = existing.createdAt;
    };

    medicines.add(medicineId, updatedRecord);
  };

  public shared ({ caller }) func deleteMedicine(medicineId : Nat) : async () {
    if (not medicines.containsKey(medicineId)) {
      Runtime.trap("Medicine not found");
    };
    medicines.remove(medicineId);
  };

  public query ({ caller }) func getMedicine(medicineId : Nat) : async MedicineRecord {
    switch (medicines.get(medicineId)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?medicine) { medicine };
    };
  };

  public query ({ caller }) func getAllMedicines() : async [MedicineRecord] {
    medicines.values().toArray().sort();
  };

  public query ({ caller }) func getLowStockMedicines() : async [MedicineRecord] {
    medicines.values().toArray().filter(
      func(m) {
        m.quantity < m.minStockAlert;
      }
    ).sort(MedicineRecord.compareByQuantity);
  };

  public shared ({ caller }) func createSale(input : SaleRecord) : async Nat {
    let saleId = nextSaleId;
    nextSaleId += 1;

    let saleRecord : SaleRecord = {
      input with
      id = saleId;
      date = getCurrentTime();
      invoiceNumber = nextInvoiceNumber;
    };

    sales.add(saleId, saleRecord);

    switch (medicines.get(saleRecord.medicineId)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?medicine) {
        if (medicine.quantity < saleRecord.quantity) {
          Runtime.trap("Not enough stock");
        };
        let updatedMedicine : MedicineRecord = {
          medicine with
          quantity = medicine.quantity - saleRecord.quantity;
        };
        medicines.add(medicine.id, updatedMedicine);
      };
    };

    nextInvoiceNumber += 1;
    saleId;
  };

  public query ({ caller }) func getSalesByDateRange(startDate : Time.Time, endDate : Time.Time) : async [SaleRecord] {
    sales.values().toArray().filter(
      func(s) {
        s.date >= startDate and s.date <= endDate
      }
    ).sort(SaleRecord.compareByDate);
  };

  public query ({ caller }) func getAllSales() : async [SaleRecord] {
    sales.values().toArray().sort(SaleRecord.compareByDate);
  };

  public shared ({ caller }) func createPurchase(input : PurchaseRecord) : async Nat {
    let purchaseId = nextPurchaseId;
    nextPurchaseId += 1;

    let purchaseRecord : PurchaseRecord = {
      input with
      id = purchaseId;
      date = getCurrentTime();
    };

    purchases.add(purchaseId, purchaseRecord);

    switch (medicines.get(purchaseRecord.medicineId)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?medicine) {
        let updatedMedicine : MedicineRecord = {
          medicine with
          quantity = medicine.quantity + purchaseRecord.quantity;
        };
        medicines.add(medicine.id, updatedMedicine);
      };
    };

    purchaseId;
  };

  public query ({ caller }) func getPurchasesByDateRange(startDate : Time.Time, endDate : Time.Time) : async [PurchaseRecord] {
    purchases.values().toArray().filter(
      func(p) {
        p.date >= startDate and p.date <= endDate
      }
    ).sort(PurchaseRecord.compareByDate);
  };

  public query ({ caller }) func getAllPurchases() : async [PurchaseRecord] {
    purchases.values().toArray().sort(PurchaseRecord.compareByDate);
  };

  public shared ({ caller }) func addDueRecord(input : DueRecord) : async Nat {
    let dueId = nextDueId;
    nextDueId += 1;

    let dueRecord : DueRecord = {
      input with
      id = dueId;
      date = getCurrentTime();
      status = "Due";
    };

    dues.add(dueId, dueRecord);
    dueId;
  };

  public shared ({ caller }) func updateDueRecord(dueId : Nat, input : DueRecord) : async () {
    let existing = switch (dues.get(dueId)) {
      case (null) { Runtime.trap("Due record not found") };
      case (?found) { found };
    };

    let updatedRecord : DueRecord = {
      input with
      id = existing.id;
      date = existing.date;
      status = existing.status;
    };

    dues.add(dueId, updatedRecord);
  };

  public shared ({ caller }) func markDueAsPaid(dueId : Nat) : async () {
    switch (dues.get(dueId)) {
      case (null) { Runtime.trap("Due record not found") };
      case (?due) {
        if (due.status == "Paid") { Runtime.trap("Already paid") };
        let updatedRecord : DueRecord = {
          due with
          status = "Paid";
        };
        dues.add(dueId, updatedRecord);
      };
    };
  };

  public query ({ caller }) func getDueRecord(dueId : Nat) : async DueRecord {
    switch (dues.get(dueId)) {
      case (null) { Runtime.trap("Due record not found") };
      case (?due) { due };
    };
  };

  public query ({ caller }) func getDueRecordsByStatus(status : Text) : async [DueRecord] {
    dues.values().toArray().filter(
      func(d) {
        d.status == status
      }
    ).sort();
  };

  public query ({ caller }) func getDueRecordsByVillage(village : Text) : async [DueRecord] {
    dues.values().toArray().filter(
      func(d) {
        d.village == village
      }
    ).sort();
  };

  public query ({ caller }) func getAllDueRecords() : async [DueRecord] {
    dues.values().toArray().sort();
  };

  public query ({ caller }) func getLowStockSortedByQuantity() : async [MedicineRecord] {
    medicines.values().toArray().filter(
      func(m) {
        m.quantity < m.minStockAlert
      }
    ).sort(MedicineRecord.compareByQuantity);
  };

  public query ({ caller }) func getLowStockSortedByExpiry() : async [MedicineRecord] {
    medicines.values().toArray().filter(
      func(m) {
        m.quantity < m.minStockAlert
      }
    ).sort(MedicineRecord.compareByExpiry);
  };

  public query ({ caller }) func getMedicinesByBrand(brand : Text) : async [MedicineRecord] {
    medicines.values().toArray().filter(
      func(m) {
        m.brand == brand
      }
    ).sort();
  };

  public query ({ caller }) func getMedicinesByType(itemType : Text) : async [MedicineRecord] {
    medicines.values().toArray().filter(
      func(m) {
        m.itemType == itemType
      }
    ).sort();
  };

  public query ({ caller }) func getMedicinesNearExpiry(days : Nat) : async [MedicineRecord] {
    let currentTime = getCurrentTime();
    let threshold = currentTime + (days * 24 * 60 * 60 * 1000000000);

    medicines.values().toArray().filter(
      func(m) {
        m.expiryDate <= threshold
      }
    ).sort(MedicineRecord.compareByExpiry);
  };
};
