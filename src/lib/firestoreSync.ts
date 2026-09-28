import { db, collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from './firebase';
import {
  INITIAL_COMPANIES,
  INITIAL_SALES,
  INITIAL_SALES_ACCESS,
  INITIAL_CUSTOMERS,
  INITIAL_CUSTOMER_COMPANIES,
  INITIAL_PRODUCTS,
  INITIAL_PRICE_LISTS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_LOGS,
} from './storage';

export const FIRESTORE_COLLECTIONS = {
  COMPANIES: 'companies',
  SALES: 'sales',
  SALES_ACCESS: 'sales_company_access',
  CUSTOMERS: 'customers',
  CUSTOMER_COMPANIES: 'customer_companies',
  PRODUCTS: 'products',
  PRICE_LISTS: 'price_lists',
  SALES_ORDERS: 'sales_orders',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
};

class FirestoreSyncService {
  private isInitialized = false;
  private isConnected = false;

  async saveDocument(collectionName: string, id: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      console.warn(`Firestore write error for ${collectionName}/${id}:`, err);
    }
  }

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Firestore delete error for ${collectionName}/${id}:`, err);
    }
  }

  async clearCollection(collectionName: string): Promise<void> {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn(`Firestore clearCollection error for ${collectionName}:`, err);
    }
  }

  /**
   * Initializes Firestore connection, bootstraps seed data if empty,
   * and sets up real-time onSnapshot listeners.
   */
  async init(onDataChanged: () => void): Promise<boolean> {
    if (this.isInitialized) return this.isConnected;

    try {
      // Test read to check connectivity and seed if empty
      const compColRef = collection(db, FIRESTORE_COLLECTIONS.COMPANIES);
      const snapshot = await getDocs(compColRef);

      if (snapshot.empty) {
        // Bootstrap initial records to Firestore
        await this.bootstrapSeedData();
      }

      // Attach real-time snapshot listeners for all core collections
      this.attachListeners(onDataChanged);

      this.isInitialized = true;
      this.isConnected = true;
      return true;
    } catch (err) {
      console.warn('Firestore initialization or connection failed; fallback to local storage:', err);
      this.isConnected = false;
      return false;
    }
  }

  private async bootstrapSeedData(): Promise<void> {
    try {
      // 1. Companies
      for (const comp of INITIAL_COMPANIES) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.COMPANIES, comp.company_id), comp);
      }
      // 2. Sales
      for (const sales of INITIAL_SALES) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.SALES, sales.sales_id), sales);
      }
      // 3. Sales Access
      for (const access of INITIAL_SALES_ACCESS) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.SALES_ACCESS, access.id), access);
      }
      // 4. Customers
      for (const cust of INITIAL_CUSTOMERS) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.CUSTOMERS, cust.customer_id), cust);
      }
      // 5. Customer Companies
      for (const cc of INITIAL_CUSTOMER_COMPANIES) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.CUSTOMER_COMPANIES, cc.id), cc);
      }
      // 6. Products
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, prod.product_id), prod);
      }
      // 7. Price Lists
      for (const pl of INITIAL_PRICE_LISTS) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.PRICE_LISTS, pl.id), pl);
      }
      // 8. Orders
      for (const order of INITIAL_ORDERS) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.SALES_ORDERS, order.so_id), order);
      }
      // 9. Payments
      for (const pay of INITIAL_PAYMENTS) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.PAYMENTS, pay.payment_id), pay);
      }
      // 10. Audit Logs
      for (const log of INITIAL_AUDIT_LOGS) {
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.AUDIT_LOGS, log.id), log);
      }
    } catch (e) {
      console.warn('Seed data bootstrap error:', e);
    }
  }

  private attachListeners(onDataChanged: () => void): void {
    const collectionsToListen = [
      { name: FIRESTORE_COLLECTIONS.COMPANIES, storageKey: 'multi_company_erp_companies_v1' },
      { name: FIRESTORE_COLLECTIONS.SALES, storageKey: 'multi_company_erp_sales_v1' },
      { name: FIRESTORE_COLLECTIONS.SALES_ACCESS, storageKey: 'multi_company_erp_sales_access_v1' },
      { name: FIRESTORE_COLLECTIONS.CUSTOMERS, storageKey: 'multi_company_erp_customers_v1' },
      { name: FIRESTORE_COLLECTIONS.CUSTOMER_COMPANIES, storageKey: 'multi_company_erp_customer_companies_v1' },
      { name: FIRESTORE_COLLECTIONS.PRODUCTS, storageKey: 'multi_company_erp_products_v1' },
      { name: FIRESTORE_COLLECTIONS.PRICE_LISTS, storageKey: 'multi_company_erp_price_lists_v1' },
      { name: FIRESTORE_COLLECTIONS.SALES_ORDERS, storageKey: 'multi_company_erp_sales_orders_v1' },
      { name: FIRESTORE_COLLECTIONS.PAYMENTS, storageKey: 'multi_company_erp_payments_v1' },
      { name: FIRESTORE_COLLECTIONS.AUDIT_LOGS, storageKey: 'multi_company_erp_audit_logs_v1' },
    ];

    collectionsToListen.forEach(({ name, storageKey }) => {
      onSnapshot(
        collection(db, name),
        (snapshot) => {
          const items = snapshot.docs.map((d) => d.data());
          try {
            localStorage.setItem(storageKey, JSON.stringify(items));
            onDataChanged();
          } catch (e) {
            console.error(`Local sync error for ${name}:`, e);
          }
        },
        (error) => {
          console.warn(`Snapshot listener error for ${name}:`, error);
        }
      );
    });
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const firestoreSync = new FirestoreSyncService();
