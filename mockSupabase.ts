
const STORAGE_KEY_PREFIX = 'mock_v2_';

class MockQueryBuilder {
  private table: string;
  private data: any[];
  private filters: ((item: any) => boolean)[] = [];
  private sortCol: string | null = null;
  private sortAsc: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + table);
    if (stored && JSON.parse(stored).length > 0) {
      this.data = JSON.parse(stored);
    } else {
      this.data = this.getSeedData(table);
      this.saveData();
    }
  }

  private getSeedData(table: string): any[] {
    const now = new Date().toISOString();
    switch (table) {
      case 'customers':
        return [
          { id: 1, name: 'John Doe', phone: '9876543210', email: 'john@example.com', created_at: now },
          { id: 2, name: 'Jane Smith', phone: '9123456789', email: 'jane@example.com', created_at: now }
        ];
      case 'items':
        return [
          { id: '1', barcode: '2001', item_name: 'Regular Fit Denim', category: 'Menswear', rate: 1299, quantity: 45, size: '32', color: 'Dark Blue', stock_status: 'in_stock', created_at: now },
          { id: '2', barcode: '2002', item_name: 'Summer Linen Shirt', category: 'Menswear', rate: 899, quantity: 20, size: 'L', color: 'White', stock_status: 'in_stock', created_at: now },
          { id: '3', barcode: '2003', item_name: 'Chiffon Maxi Dress', category: 'Womenswear', rate: 2499, quantity: 12, size: 'M', color: 'Floral Red', stock_status: 'in_stock', created_at: now }
        ];
      case 'gold_rates':
        return [
          { id: 1, effective_date: now.split('T')[0], rate_22k: 7500, rate_24k: 8200, created_at: now }
        ];
      case 'users':
        return [
          { 
            id: 1, 
            username: 'dummy', 
            password_hash: 'dummy123', 
            role: 'admin', 
            staff_code: 'DUMMY001',
            can_edit_bills: true,
            can_edit_stock: true,
            can_authorize_nongst: true,
            created_at: now 
          }
        ];
      default:
        return [];
    }
  }

  private saveData() {
    localStorage.setItem(STORAGE_KEY_PREFIX + this.table, JSON.stringify(this.data));
  }

  select(query: string = '*') {
    // Basic select doesn't filter data, just starts the chain
    return this;
  }

  insert(values: any | any[]) {
    const newItems = Array.isArray(values) ? values : [values];
    const itemsWithIds = newItems.map(item => ({
      id: Math.floor(Math.random() * 1000000),
      created_at: new Date().toISOString(),
      ...item
    }));
    this.data.push(...itemsWithIds);
    this.saveData();
    return this.wrapResponse(itemsWithIds);
  }

  update(values: any) {
    const filteredIndexes = this.data
      .map((item, index) => (this.applyFilters(item) ? index : -1))
      .filter(index => index !== -1);

    filteredIndexes.forEach(index => {
      this.data[index] = { ...this.data[index], ...values };
    });

    this.saveData();
    const updatedItems = filteredIndexes.map(index => this.data[index]);
    return this.wrapResponse(updatedItems);
  }

  delete() {
    const remaining = this.data.filter(item => !this.applyFilters(item));
    this.data = remaining;
    this.saveData();
    return this.wrapResponse([]);
  }

  eq(column: string, value: any) {
    this.filters.push(item => item[column] == value);
    return this;
  }

  or(query: string) {
    // Simple parser for "col1.ilike.%val%,col2.ilike.%val%"
    const conditions = query.split(',');
    this.filters.push(item => {
      return conditions.some(cond => {
        const [col, op, pattern] = cond.split('.');
        if (op === 'ilike') {
          const val = pattern.replace(/%/g, '').toLowerCase();
          return String(item[col] || '').toLowerCase().includes(val);
        }
        return false;
      });
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.sortCol = column;
    this.sortAsc = ascending;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  private applyFilters(item: any) {
    return this.filters.every(f => f(item));
  }

  private wrapResponse(data: any) {
    // Return a promise that resolves to { data, error }
    // If it's a chainable return, we need to handle `.single()` or `.then()`
    const result = {
      data: this.isSingle ? (Array.isArray(data) ? data[0] : data) : data,
      error: null
    };

    // Make it look like a promise
    return Object.assign(Promise.resolve(result), {
      select: () => result, // Simple fallback for .select() after insert
      single: () => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error: null })
    });
  }

  // To support `await query`
  then(onfulfilled?: any, onrejected?: any) {
    let filteredData = this.data.filter(item => this.applyFilters(item));

    if (this.sortCol) {
      filteredData.sort((a, b) => {
        const valA = a[this.sortCol!];
        const valB = b[this.sortCol!];
        if (valA < valB) return this.sortAsc ? -1 : 1;
        if (valA > valB) return this.sortAsc ? 1 : -1;
        return 0;
      });
    }

    if (this.limitCount !== null) {
      filteredData = filteredData.slice(0, this.limitCount);
    }

    const resultData = this.isSingle ? filteredData[0] || null : filteredData;
    return Promise.resolve({ data: resultData, error: null }).then(onfulfilled, onrejected);
  }
}

export const mockSupabase = {
  from: (table: string) => new MockQueryBuilder(table),
  // Add other client methods as needed
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'mock-user' } }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: {} }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  }
};
