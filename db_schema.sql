-- ==========================================
-- AR FASHION ERP - BACKEND DATABASE SCHEMA
-- Target: Supabase (PostgreSQL)
-- ==========================================

-- 1. ENUMS & TYPES
CREATE TYPE stock_status AS ENUM ('in_stock', 'out_of_stock', 'sold');
CREATE TYPE bill_status AS ENUM ('draft', 'final', 'cancelled');
CREATE TYPE booking_status AS ENUM ('active', 'delivered', 'cancelled', 'completed');
CREATE TYPE sale_type_mode AS ENUM ('gst', 'nongst');

-- 2. USERS (STAFF)
-- Note: This is separate from Supabase Auth but can be linked via 'auth_user_id'
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- For mock/legacy migration support
    role TEXT DEFAULT 'staff',
    staff_code TEXT UNIQUE,
    can_edit_bills BOOLEAN DEFAULT false,
    can_edit_stock BOOLEAN DEFAULT false,
    can_authorize_nongst BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    customer_code TEXT UNIQUE, -- e.g. CUST-0001
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 4. ITEMS (INVENTORY)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode TEXT UNIQUE,
    item_name TEXT NOT NULL,
    category TEXT,
    rate NUMERIC(15, 2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    size TEXT,
    color TEXT,
    hsn_code TEXT DEFAULT '6204',
    stock_status stock_status DEFAULT 'in_stock',
    location TEXT, -- e.g. Shelf A1
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(item_name);

-- 5. BILLS (SALES TRANSACTIONS)
CREATE TABLE IF NOT EXISTS bills (
    id BIGSERIAL PRIMARY KEY,
    bill_no TEXT UNIQUE NOT NULL, -- e.g. AR-0001
    bill_date DATE DEFAULT CURRENT_DATE,
    customer_id BIGINT REFERENCES customers(id),
    staff_id BIGINT REFERENCES users(id),
    sale_type sale_type_mode DEFAULT 'gst',
    subtotal NUMERIC(15, 2) DEFAULT 0,
    gst_amount NUMERIC(15, 2) DEFAULT 0,
    grand_total NUMERIC(15, 2) DEFAULT 0,
    discount NUMERIC(15, 2) DEFAULT 0,
    payment_method JSONB DEFAULT '[]'::jsonb, -- Store list of payments: [{type: 'cash', amount: 500}]
    bill_status bill_status DEFAULT 'final',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_no ON bills(bill_no);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);

-- 6. BILL ITEMS
CREATE TABLE IF NOT EXISTS bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT REFERENCES bills(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(15, 3) DEFAULT 1,
    rate NUMERIC(15, 2) DEFAULT 0,
    line_total NUMERIC(15, 2) DEFAULT 0,
    sl_no INTEGER, -- Sequence in the bill
    hsn_code TEXT,
    barcode TEXT, -- Link back to inventory if scanned
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

-- 7. LAYAWAY TRANSACTIONS
CREATE TABLE IF NOT EXISTS layaway_transactions (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT REFERENCES bills(id) ON DELETE CASCADE,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_layaway_bill_id ON layaway_transactions(bill_id);

-- 8. ADVANCE BOOKINGS (ORDER BOOKING)
CREATE TABLE IF NOT EXISTS advance_bookings (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT REFERENCES bills(id) ON DELETE CASCADE,
    booking_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    advance_amount NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    item_description TEXT,
    customer_notes TEXT,
    booking_status booking_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_advance_bill_id ON advance_bookings(bill_id);

-- ==========================================
-- BASIC SECURITY (RLS) - Optional
-- ==========================================
-- ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for authenticated users" ON bills FOR ALL TO authenticated USING (true);

-- ==========================================
-- ROW VERSIONING TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_layaway_updated_at BEFORE UPDATE ON layaway_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_booking_updated_at BEFORE UPDATE ON advance_bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
