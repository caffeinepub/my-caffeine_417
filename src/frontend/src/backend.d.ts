import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MedicineRecord {
    id: bigint;
    purchasePrice: bigint;
    expiryDate: Time;
    name: string;
    createdAt: Time;
    minStockAlert: bigint;
    sellingPrice: bigint;
    itemType: string;
    quantity: bigint;
    brand: string;
}
export type Time = bigint;
export interface DueRecord {
    id: bigint;
    customerName: string;
    status: string;
    date: Time;
    neighborhood: string;
    fatherName: string;
    village: string;
    itemType: string;
    quantity: bigint;
    mobile: string;
    unitPrice: bigint;
    totalPrice: bigint;
    medicineId: bigint;
    medicineName: string;
}
export interface PurchaseRecord {
    id: bigint;
    supplierName: string;
    date: Time;
    quantity: bigint;
    unitPrice: bigint;
    totalPrice: bigint;
    medicineId: bigint;
    medicineName: string;
}
export interface SaleRecord {
    id: bigint;
    customerName?: string;
    date: Time;
    invoiceNumber: bigint;
    notes?: string;
    quantity: bigint;
    brand: string;
    unitPrice: bigint;
    totalPrice: bigint;
    medicineId: bigint;
    medicineName: string;
}
export interface backendInterface {
    addDueRecord(input: DueRecord): Promise<bigint>;
    addMedicine(input: MedicineRecord): Promise<bigint>;
    createPurchase(input: PurchaseRecord): Promise<bigint>;
    createSale(input: SaleRecord): Promise<bigint>;
    deleteMedicine(medicineId: bigint): Promise<void>;
    getAllDueRecords(): Promise<Array<DueRecord>>;
    getAllMedicines(): Promise<Array<MedicineRecord>>;
    getAllPurchases(): Promise<Array<PurchaseRecord>>;
    getAllSales(): Promise<Array<SaleRecord>>;
    getDueRecord(dueId: bigint): Promise<DueRecord>;
    getDueRecordsByStatus(status: string): Promise<Array<DueRecord>>;
    getDueRecordsByVillage(village: string): Promise<Array<DueRecord>>;
    getLowStockMedicines(): Promise<Array<MedicineRecord>>;
    getLowStockSortedByExpiry(): Promise<Array<MedicineRecord>>;
    getLowStockSortedByQuantity(): Promise<Array<MedicineRecord>>;
    getMedicine(medicineId: bigint): Promise<MedicineRecord>;
    getMedicinesByBrand(brand: string): Promise<Array<MedicineRecord>>;
    getMedicinesByType(itemType: string): Promise<Array<MedicineRecord>>;
    getMedicinesNearExpiry(days: bigint): Promise<Array<MedicineRecord>>;
    getPurchasesByDateRange(startDate: Time, endDate: Time): Promise<Array<PurchaseRecord>>;
    getSalesByDateRange(startDate: Time, endDate: Time): Promise<Array<SaleRecord>>;
    markDueAsPaid(dueId: bigint): Promise<void>;
    updateDueRecord(dueId: bigint, input: DueRecord): Promise<void>;
    updateMedicine(medicineId: bigint, input: MedicineRecord): Promise<void>;
}
