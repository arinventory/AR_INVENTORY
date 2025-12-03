-- Truncate All Tables Script
-- This script deletes all rows from all tables in the correct order
-- Run this before inserting sample data to ensure a clean database

-- ============================================
-- DELETE ALL ROWS FROM TABLES (in reverse dependency order)
-- This method is more reliable than TRUNCATE for foreign keys
-- ============================================

-- Child tables first (items, ledger entries, payments)
DELETE FROM public.sales_items;
DELETE FROM public.wholesale_sales_items;
DELETE FROM public.purchase_order_items;
DELETE FROM public.inventory_transactions;

-- Credit ledger and payment tables
DELETE FROM public.buyer_credit_ledger;
DELETE FROM public.credit_ledger;
DELETE FROM public.buyer_payments;
DELETE FROM public.payments;

-- Sales and purchase order tables
DELETE FROM public.sales;
DELETE FROM public.wholesale_sales;
DELETE FROM public.purchase_orders;

-- Product tables
DELETE FROM public.retail_products;
DELETE FROM public.wholesale_products;

-- Customer and supplier tables
DELETE FROM public.customers;
DELETE FROM public.wholesale_buyers;
DELETE FROM public.suppliers;

-- ============================================
-- ALTERNATIVE: TRUNCATE with CASCADE (faster but may have issues)
-- ============================================
-- Uncomment below if you prefer TRUNCATE (faster for large datasets)

/*
TRUNCATE TABLE public.sales_items CASCADE;
TRUNCATE TABLE public.wholesale_sales_items CASCADE;
TRUNCATE TABLE public.purchase_order_items CASCADE;
TRUNCATE TABLE public.inventory_transactions CASCADE;
TRUNCATE TABLE public.buyer_credit_ledger CASCADE;
TRUNCATE TABLE public.credit_ledger CASCADE;
TRUNCATE TABLE public.buyer_payments CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.sales CASCADE;
TRUNCATE TABLE public.wholesale_sales CASCADE;
TRUNCATE TABLE public.purchase_orders CASCADE;
TRUNCATE TABLE public.retail_products CASCADE;
TRUNCATE TABLE public.wholesale_products CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.wholesale_buyers CASCADE;
TRUNCATE TABLE public.suppliers CASCADE;
*/

-- ============================================
-- RESET SEQUENCES (if any auto-increment columns exist)
-- ============================================
-- Note: UUIDs are used, so sequences may not be needed
-- But included for completeness

-- ============================================
-- VERIFICATION QUERIES (optional - uncomment to check)
-- ============================================
/*
SELECT 'suppliers' as table_name, COUNT(*) as row_count FROM public.suppliers
UNION ALL
SELECT 'wholesale_products', COUNT(*) FROM public.wholesale_products
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM public.purchase_orders
UNION ALL
SELECT 'purchase_order_items', COUNT(*) FROM public.purchase_order_items
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'credit_ledger', COUNT(*) FROM public.credit_ledger
UNION ALL
SELECT 'wholesale_buyers', COUNT(*) FROM public.wholesale_buyers
UNION ALL
SELECT 'wholesale_sales', COUNT(*) FROM public.wholesale_sales
UNION ALL
SELECT 'wholesale_sales_items', COUNT(*) FROM public.wholesale_sales_items
UNION ALL
SELECT 'buyer_payments', COUNT(*) FROM public.buyer_payments
UNION ALL
SELECT 'buyer_credit_ledger', COUNT(*) FROM public.buyer_credit_ledger
UNION ALL
SELECT 'retail_products', COUNT(*) FROM public.retail_products
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'sales', COUNT(*) FROM public.sales
UNION ALL
SELECT 'sales_items', COUNT(*) FROM public.sales_items;
*/

