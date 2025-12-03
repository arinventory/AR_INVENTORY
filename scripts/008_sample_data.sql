-- Sample Data for Testing Reports
-- This script inserts comprehensive sample data to test all report functionalities

-- ============================================
-- 1. SUPPLIERS (B2B)
-- ============================================
INSERT INTO public.suppliers (id, name, email, phone, address, city, state, postal_code, country, contact_person, payment_terms) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Textile Manufacturers Ltd', 'contact@textilemfg.com', '9876543210', '123 Industrial Area', 'Mumbai', 'Maharashtra', '400001', 'India', 'Rajesh Kumar', 'Net 30'),
('550e8400-e29b-41d4-a716-446655440002', 'Fashion Fabrics Co', 'sales@fashionfabrics.com', '9876543211', '456 Textile Street', 'Delhi', 'Delhi', '110001', 'India', 'Priya Sharma', 'Net 45'),
('550e8400-e29b-41d4-a716-446655440003', 'Premium Cloth Suppliers', 'info@premiumcloth.com', '9876543212', '789 Garment Road', 'Bangalore', 'Karnataka', '560001', 'India', 'Amit Patel', 'Net 30'),
('550e8400-e29b-41d4-a716-446655440004', 'Wholesale Textiles Inc', 'orders@wholesaletextiles.com', '9876543213', '321 Trade Center', 'Chennai', 'Tamil Nadu', '600001', 'India', 'Suresh Reddy', 'Net 60')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. WHOLESALE PRODUCTS (with expenses and GST)
-- ============================================
INSERT INTO public.wholesale_products (id, supplier_id, name, sku, description, cost_price, wholesale_price, quantity_in_stock, reorder_level, expenses, gst_percentage) VALUES
-- Products from Supplier 1
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Cotton T-Shirt - White', 'WSH-COT-WHT-001', 'Premium quality white cotton t-shirt', 150.00, 250.00, 100, 20, 10.00, 5.00),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Cotton T-Shirt - Black', 'WSH-COT-BLK-001', 'Premium quality black cotton t-shirt', 150.00, 250.00, 80, 20, 10.00, 5.00),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Denim Jeans - Blue', 'WSH-DEN-BLU-001', 'Classic blue denim jeans', 400.00, 650.00, 50, 15, 25.00, 5.00),

-- Products from Supplier 2
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Formal Shirt - White', 'WSH-FRM-WHT-001', 'Business formal white shirt', 300.00, 500.00, 60, 15, 20.00, 5.00),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Formal Shirt - Blue', 'WSH-FRM-BLU-001', 'Business formal blue shirt', 300.00, 500.00, 70, 15, 20.00, 5.00),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Chinos - Khaki', 'WSH-CHN-KHK-001', 'Casual khaki chinos', 350.00, 600.00, 40, 10, 25.00, 5.00),

-- Products from Supplier 3
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Polo Shirt - Navy', 'WSH-POL-NAV-001', 'Classic navy polo shirt', 200.00, 400.00, 90, 20, 15.00, 5.00),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Polo Shirt - Red', 'WSH-POL-RED-001', 'Classic red polo shirt', 200.00, 400.00, 85, 20, 15.00, 5.00),

-- Products from Supplier 4
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Hoodie - Gray', 'WSH-HOD-GRY-001', 'Comfortable gray hoodie', 450.00, 750.00, 30, 10, 30.00, 5.00),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Hoodie - Black', 'WSH-HOD-BLK-001', 'Comfortable black hoodie', 450.00, 750.00, 35, 10, 30.00, 5.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. PURCHASE ORDERS
-- ============================================
INSERT INTO public.purchase_orders (id, supplier_id, order_number, order_date, expected_delivery_date, actual_delivery_date, total_amount, status, notes) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'PO-2024-001', '2024-01-15', '2024-01-30', '2024-01-28', 50000.00, 'received', 'Initial stock order'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'PO-2024-002', '2024-02-01', '2024-02-15', '2024-02-14', 75000.00, 'received', 'Formal wear collection'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'PO-2024-003', '2024-02-10', '2024-02-25', '2024-02-24', 60000.00, 'received', 'Polo shirts order'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'PO-2024-004', '2024-03-05', '2024-03-20', NULL, 30000.00, 'pending', 'Restocking order'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'PO-2024-005', '2024-03-10', '2024-03-25', NULL, 45000.00, 'pending', 'Hoodies order')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. PURCHASE ORDER ITEMS
-- ============================================
INSERT INTO public.purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price, line_total) VALUES
-- PO-2024-001 items
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 100, 150.00, 15000.00),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 80, 150.00, 12000.00),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 50, 400.00, 20000.00),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 60, 300.00, 18000.00),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 70, 300.00, 21000.00),
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', 40, 350.00, 14000.00),
('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 20, 300.00, 6000.00),
('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', 90, 200.00, 18000.00),
('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440008', 85, 200.00, 17000.00),
('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', 50, 200.00, 10000.00),
('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 50, 150.00, 7500.00),
('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 50, 150.00, 7500.00),
('880e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 30, 400.00, 12000.00),
('880e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440009', 30, 450.00, 13500.00),
('880e8400-e29b-41d4-a716-446655440015', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440010', 35, 450.00, 15750.00),
('880e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440009', 20, 450.00, 9000.00),
('880e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440010', 15, 450.00, 6750.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. PAYMENTS TO SUPPLIERS
-- ============================================
INSERT INTO public.payments (id, supplier_id, amount, payment_date, method, reference_no, purchase_order_id, notes) VALUES
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 30000.00, '2024-02-05', 'bank_transfer', 'TXN-2024-001', '770e8400-e29b-41d4-a716-446655440001', 'Partial payment for PO-2024-001'),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 20000.00, '2024-02-20', 'bank_transfer', 'TXN-2024-002', '770e8400-e29b-41d4-a716-446655440001', 'Final payment for PO-2024-001'),
('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 75000.00, '2024-02-25', 'cheque', 'CHQ-2024-001', '770e8400-e29b-41d4-a716-446655440002', 'Full payment for PO-2024-002'),
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 40000.00, '2024-03-01', 'upi', 'UPI-2024-001', '770e8400-e29b-41d4-a716-446655440003', 'Partial payment for PO-2024-003'),
('990e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 20000.00, '2024-03-10', 'bank_transfer', 'TXN-2024-003', '770e8400-e29b-41d4-a716-446655440003', 'Final payment for PO-2024-003')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. SUPPLIER CREDIT LEDGER
-- ============================================
INSERT INTO public.credit_ledger (id, supplier_id, transaction_type, amount, reference_id, reference_type, description, balance_after) VALUES
-- Supplier 1 transactions
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'debit', 50000.00, '770e8400-e29b-41d4-a716-446655440001', 'purchase_order', 'Purchase Order PO-2024-001', 50000.00),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'credit', 30000.00, '990e8400-e29b-41d4-a716-446655440001', 'payment', 'Payment TXN-2024-001', 20000.00),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'credit', 20000.00, '990e8400-e29b-41d4-a716-446655440002', 'payment', 'Payment TXN-2024-002', 0.00),
('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'debit', 30000.00, '770e8400-e29b-41d4-a716-446655440004', 'purchase_order', 'Purchase Order PO-2024-004', 30000.00),

-- Supplier 2 transactions
('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'debit', 75000.00, '770e8400-e29b-41d4-a716-446655440002', 'purchase_order', 'Purchase Order PO-2024-002', 75000.00),
('aa0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'credit', 75000.00, '990e8400-e29b-41d4-a716-446655440003', 'payment', 'Payment CHQ-2024-001', 0.00),

-- Supplier 3 transactions
('aa0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'debit', 60000.00, '770e8400-e29b-41d4-a716-446655440003', 'purchase_order', 'Purchase Order PO-2024-003', 60000.00),
('aa0e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'credit', 40000.00, '990e8400-e29b-41d4-a716-446655440004', 'payment', 'Payment UPI-2024-001', 20000.00),
('aa0e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'credit', 20000.00, '990e8400-e29b-41d4-a716-446655440005', 'payment', 'Payment TXN-2024-003', 0.00),

-- Supplier 4 transactions
('aa0e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'debit', 45000.00, '770e8400-e29b-41d4-a716-446655440005', 'purchase_order', 'Purchase Order PO-2024-005', 45000.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. WHOLESALE BUYERS
-- ============================================
INSERT INTO public.wholesale_buyers (id, name, phone, address, city, state, postal_code, country) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'Fashion Retail Store', '9123456789', '100 Main Street', 'Mumbai', 'Maharashtra', '400001', 'India'),
('bb0e8400-e29b-41d4-a716-446655440002', 'Trendy Clothing Outlet', '9123456790', '200 Market Road', 'Delhi', 'Delhi', '110001', 'India'),
('bb0e8400-e29b-41d4-a716-446655440003', 'Style Hub', '9123456791', '300 Fashion Avenue', 'Bangalore', 'Karnataka', '560001', 'India'),
('bb0e8400-e29b-41d4-a716-446655440004', 'Urban Wear Shop', '9123456792', '400 Commercial Street', 'Pune', 'Maharashtra', '411001', 'India')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. WHOLESALE SALES
-- ============================================
INSERT INTO public.wholesale_sales (id, customer_id, customer_name, invoice_number, sale_date, subtotal, tax_amount, discount_amount, total_amount, payment_status, notes) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 'Fashion Retail Store', 'INV-B2B-2024-001', '2024-02-01', 50000.00, 2500.00, 0.00, 52500.00, 'paid', 'First order from buyer'),
('cc0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440002', 'Trendy Clothing Outlet', 'INV-B2B-2024-002', '2024-02-05', 75000.00, 3750.00, 5000.00, 73750.00, 'partial', 'Bulk order with discount'),
('cc0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440003', 'Style Hub', 'INV-B2B-2024-003', '2024-02-10', 60000.00, 3000.00, 0.00, 63000.00, 'pending', 'Regular order'),
('cc0e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440001', 'Fashion Retail Store', 'INV-B2B-2024-004', '2024-02-15', 40000.00, 2000.00, 2000.00, 40000.00, 'paid', 'Repeat customer'),
('cc0e8400-e29b-41d4-a716-446655440005', 'bb0e8400-e29b-41d4-a716-446655440004', 'Urban Wear Shop', 'INV-B2B-2024-005', '2024-02-20', 90000.00, 4500.00, 0.00, 94500.00, 'pending', 'Large order'),
('cc0e8400-e29b-41d4-a716-446655440006', 'bb0e8400-e29b-41d4-a716-446655440002', 'Trendy Clothing Outlet', 'INV-B2B-2024-006', '2024-03-01', 55000.00, 2750.00, 0.00, 57750.00, 'partial', 'Follow-up order')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. WHOLESALE SALES ITEMS
-- ============================================
INSERT INTO public.wholesale_sales_items (id, sale_id, product_id, quantity, unit_price, line_total) VALUES
-- INV-B2B-2024-001 items
('dd0e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 50, 250.00, 12500.00),
('dd0e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 40, 250.00, 10000.00),
('dd0e8400-e29b-41d4-a716-446655440003', 'cc0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 30, 650.00, 19500.00),
('dd0e8400-e29b-41d4-a716-446655440004', 'cc0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440007', 20, 400.00, 8000.00),

-- INV-B2B-2024-002 items
('dd0e8400-e29b-41d4-a716-446655440005', 'cc0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 60, 500.00, 30000.00),
('dd0e8400-e29b-41d4-a716-446655440006', 'cc0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 70, 500.00, 35000.00),
('dd0e8400-e29b-41d4-a716-446655440007', 'cc0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', 40, 600.00, 24000.00),

-- INV-B2B-2024-003 items
('dd0e8400-e29b-41d4-a716-446655440008', 'cc0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', 90, 400.00, 36000.00),
('dd0e8400-e29b-41d4-a716-446655440009', 'cc0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440008', 60, 400.00, 24000.00),

-- INV-B2B-2024-004 items
('dd0e8400-e29b-41d4-a716-446655440010', 'cc0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 40, 250.00, 10000.00),
('dd0e8400-e29b-41d4-a716-446655440011', 'cc0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 30, 250.00, 7500.00),
('dd0e8400-e29b-41d4-a716-446655440012', 'cc0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 20, 650.00, 13000.00),
('dd0e8400-e29b-41d4-a716-446655440013', 'cc0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440007', 25, 400.00, 10000.00),

-- INV-B2B-2024-005 items
('dd0e8400-e29b-41d4-a716-446655440014', 'cc0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440009', 30, 750.00, 22500.00),
('dd0e8400-e29b-41d4-a716-446655440015', 'cc0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440010', 35, 750.00, 26250.00),
('dd0e8400-e29b-41d4-a716-446655440016', 'cc0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 50, 250.00, 12500.00),
('dd0e8400-e29b-41d4-a716-446655440017', 'cc0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 40, 500.00, 20000.00),
('dd0e8400-e29b-41d4-a716-446655440018', 'cc0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440007', 30, 400.00, 12000.00),

-- INV-B2B-2024-006 items
('dd0e8400-e29b-41d4-a716-446655440019', 'cc0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440005', 50, 500.00, 25000.00),
('dd0e8400-e29b-41d4-a716-446655440020', 'cc0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 30, 600.00, 18000.00),
('dd0e8400-e29b-41d4-a716-446655440021', 'cc0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440008', 25, 400.00, 10000.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 10. BUYER PAYMENTS
-- ============================================
INSERT INTO public.buyer_payments (id, customer_id, amount, payment_date, method, reference_no, wholesale_sale_id, notes) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 52500.00, '2024-02-05', 'bank_transfer', 'PAY-B2B-001', 'cc0e8400-e29b-41d4-a716-446655440001', 'Full payment for INV-B2B-2024-001'),
('ee0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440002', 40000.00, '2024-02-10', 'cheque', 'PAY-B2B-002', 'cc0e8400-e29b-41d4-a716-446655440002', 'Partial payment for INV-B2B-2024-002'),
('ee0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440001', 40000.00, '2024-02-20', 'upi', 'PAY-B2B-003', 'cc0e8400-e29b-41d4-a716-446655440004', 'Full payment for INV-B2B-2024-004'),
('ee0e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440002', 20000.00, '2024-03-05', 'bank_transfer', 'PAY-B2B-004', 'cc0e8400-e29b-41d4-a716-446655440002', 'Additional payment for INV-B2B-2024-002'),
('ee0e8400-e29b-41d4-a716-446655440005', 'bb0e8400-e29b-41d4-a716-446655440002', 30000.00, '2024-03-08', 'bank_transfer', 'PAY-B2B-005', 'cc0e8400-e29b-41d4-a716-446655440006', 'Partial payment for INV-B2B-2024-006')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. BUYER CREDIT LEDGER
-- ============================================
INSERT INTO public.buyer_credit_ledger (id, customer_id, transaction_type, amount, reference_id, reference_type, description, balance_after) VALUES
-- Buyer 1 transactions
('ff0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 'debit', 52500.00, 'cc0e8400-e29b-41d4-a716-446655440001', 'wholesale_sale', 'Invoice INV-B2B-2024-001', 52500.00),
('ff0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440001', 'credit', 52500.00, 'ee0e8400-e29b-41d4-a716-446655440001', 'buyer_payment', 'Payment PAY-B2B-001', 0.00),
('ff0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440001', 'debit', 40000.00, 'cc0e8400-e29b-41d4-a716-446655440004', 'wholesale_sale', 'Invoice INV-B2B-2024-004', 40000.00),
('ff0e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440001', 'credit', 40000.00, 'ee0e8400-e29b-41d4-a716-446655440003', 'buyer_payment', 'Payment PAY-B2B-003', 0.00),

-- Buyer 2 transactions
('ff0e8400-e29b-41d4-a716-446655440005', 'bb0e8400-e29b-41d4-a716-446655440002', 'debit', 73750.00, 'cc0e8400-e29b-41d4-a716-446655440002', 'wholesale_sale', 'Invoice INV-B2B-2024-002', 73750.00),
('ff0e8400-e29b-41d4-a716-446655440006', 'bb0e8400-e29b-41d4-a716-446655440002', 'credit', 40000.00, 'ee0e8400-e29b-41d4-a716-446655440002', 'buyer_payment', 'Payment PAY-B2B-002', 33750.00),
('ff0e8400-e29b-41d4-a716-446655440007', 'bb0e8400-e29b-41d4-a716-446655440002', 'credit', 20000.00, 'ee0e8400-e29b-41d4-a716-446655440004', 'buyer_payment', 'Payment PAY-B2B-004', 13750.00),
('ff0e8400-e29b-41d4-a716-446655440008', 'bb0e8400-e29b-41d4-a716-446655440002', 'debit', 57750.00, 'cc0e8400-e29b-41d4-a716-446655440006', 'wholesale_sale', 'Invoice INV-B2B-2024-006', 71500.00),
('ff0e8400-e29b-41d4-a716-446655440009', 'bb0e8400-e29b-41d4-a716-446655440002', 'credit', 30000.00, 'ee0e8400-e29b-41d4-a716-446655440005', 'buyer_payment', 'Payment PAY-B2B-005', 41500.00),

-- Buyer 3 transactions
('ff0e8400-e29b-41d4-a716-446655440010', 'bb0e8400-e29b-41d4-a716-446655440003', 'debit', 63000.00, 'cc0e8400-e29b-41d4-a716-446655440003', 'wholesale_sale', 'Invoice INV-B2B-2024-003', 63000.00),

-- Buyer 4 transactions
('ff0e8400-e29b-41d4-a716-446655440011', 'bb0e8400-e29b-41d4-a716-446655440004', 'debit', 94500.00, 'cc0e8400-e29b-41d4-a716-446655440005', 'wholesale_sale', 'Invoice INV-B2B-2024-005', 94500.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 12. RETAIL PRODUCTS (B2C)
-- Note: sku column was renamed to size in migration script 002
-- Unique constraint on (product_type, size) - each combination must be unique
-- ============================================
INSERT INTO public.retail_products (id, name, size, description, cost_price, retail_price, quantity_in_stock, reorder_level, product_type) VALUES
('110e8400-e29b-41d4-a716-446655440001', 'Cotton T-Shirt - White', 'M', 'Premium quality white cotton t-shirt', 200.00, 399.00, 50, 10, 'T-Shirt'),
('110e8400-e29b-41d4-a716-446655440002', 'Cotton T-Shirt - Black', 'L', 'Premium quality black cotton t-shirt', 200.00, 399.00, 45, 10, 'T-Shirt'),
('110e8400-e29b-41d4-a716-446655440003', 'Denim Jeans - Blue', '32', 'Classic blue denim jeans', 550.00, 999.00, 30, 8, 'Jeans'),
('110e8400-e29b-41d4-a716-446655440004', 'Formal Shirt - White', 'L', 'Business formal white shirt', 450.00, 799.00, 40, 10, 'Shirt'),
('110e8400-e29b-41d4-a716-446655440005', 'Formal Shirt - Blue', 'M', 'Business formal blue shirt', 450.00, 799.00, 35, 10, 'Shirt'),
('110e8400-e29b-41d4-a716-446655440006', 'Polo Shirt - Navy', 'M', 'Classic navy polo shirt', 350.00, 599.00, 55, 12, 'Polo'),
('110e8400-e29b-41d4-a716-446655440007', 'Polo Shirt - Red', 'L', 'Classic red polo shirt', 350.00, 599.00, 50, 12, 'Polo'),
('110e8400-e29b-41d4-a716-446655440008', 'Hoodie - Gray', 'XL', 'Comfortable gray hoodie', 650.00, 1299.00, 20, 5, 'Hoodie'),
('110e8400-e29b-41d4-a716-446655440009', 'Hoodie - Black', 'M', 'Comfortable black hoodie', 650.00, 1299.00, 25, 5, 'Hoodie')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 13. CUSTOMERS (B2C)
-- ============================================
INSERT INTO public.customers (id, name, email, phone, address, city, state, postal_code, country, customer_type) VALUES
('220e8400-e29b-41d4-a716-446655440001', 'Rahul Sharma', 'rahul.sharma@email.com', '9876543210', '101 Residential Area', 'Mumbai', 'Maharashtra', '400001', 'India', 'retail'),
('220e8400-e29b-41d4-a716-446655440002', 'Priya Patel', 'priya.patel@email.com', '9876543211', '202 Housing Society', 'Delhi', 'Delhi', '110001', 'India', 'retail'),
('220e8400-e29b-41d4-a716-446655440003', 'Amit Kumar', 'amit.kumar@email.com', '9876543212', '303 Apartment Complex', 'Bangalore', 'Karnataka', '560001', 'India', 'retail'),
('220e8400-e29b-41d4-a716-446655440004', 'Sneha Reddy', 'sneha.reddy@email.com', '9876543213', '404 Street Name', 'Chennai', 'Tamil Nadu', '600001', 'India', 'retail'),
('220e8400-e29b-41d4-a716-446655440005', 'Vikram Singh', 'vikram.singh@email.com', '9876543214', '505 Colony', 'Pune', 'Maharashtra', '411001', 'India', 'retail')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 14. SALES (B2C)
-- ============================================
INSERT INTO public.sales (id, customer_id, invoice_number, sale_date, subtotal, tax_amount, discount_amount, total_amount, payment_status, status, notes) VALUES
('330e8400-e29b-41d4-a716-446655440001', '220e8400-e29b-41d4-a716-446655440001', 'INV-RTL-2024-001', '2024-02-05', 1998.00, 199.80, 0.00, 2197.80, 'paid', 'completed', 'Regular customer'),
('330e8400-e29b-41d4-a716-446655440002', '220e8400-e29b-41d4-a716-446655440002', 'INV-RTL-2024-002', '2024-02-08', 2997.00, 299.70, 500.00, 2796.70, 'paid', 'completed', 'Bulk purchase discount'),
('330e8400-e29b-41d4-a716-446655440003', '220e8400-e29b-41d4-a716-446655440003', 'INV-RTL-2024-003', '2024-02-12', 1598.00, 159.80, 0.00, 1757.80, 'pending', 'completed', 'New customer'),
('330e8400-e29b-41d4-a716-446655440004', '220e8400-e29b-41d4-a716-446655440001', 'INV-RTL-2024-004', '2024-02-15', 2598.00, 259.80, 200.00, 2657.80, 'paid', 'completed', 'Repeat purchase'),
('330e8400-e29b-41d4-a716-446655440005', '220e8400-e29b-41d4-a716-446655440004', 'INV-RTL-2024-005', '2024-02-20', 3996.00, 399.60, 0.00, 4395.60, 'partial', 'completed', 'Large order'),
('330e8400-e29b-41d4-a716-446655440006', '220e8400-e29b-41d4-a716-446655440005', 'INV-RTL-2024-006', '2024-02-25', 1798.00, 179.80, 0.00, 1977.80, 'pending', 'completed', 'Regular customer'),
('330e8400-e29b-41d4-a716-446655440007', '220e8400-e29b-41d4-a716-446655440002', 'INV-RTL-2024-007', '2024-03-01', 2598.00, 259.80, 0.00, 2857.80, 'paid', 'completed', 'Follow-up order')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 15. SALES ITEMS (B2C)
-- ============================================
INSERT INTO public.sales_items (id, sale_id, product_id, quantity, unit_price, line_total) VALUES
-- INV-RTL-2024-001 items
('440e8400-e29b-41d4-a716-446655440001', '330e8400-e29b-41d4-a716-446655440001', '110e8400-e29b-41d4-a716-446655440001', 2, 399.00, 798.00),
('440e8400-e29b-41d4-a716-446655440002', '330e8400-e29b-41d4-a716-446655440001', '110e8400-e29b-41d4-a716-446655440002', 1, 399.00, 399.00),
('440e8400-e29b-41d4-a716-446655440003', '330e8400-e29b-41d4-a716-446655440001', '110e8400-e29b-41d4-a716-446655440003', 1, 999.00, 999.00),

-- INV-RTL-2024-002 items
('440e8400-e29b-41d4-a716-446655440004', '330e8400-e29b-41d4-a716-446655440002', '110e8400-e29b-41d4-a716-446655440004', 2, 799.00, 1598.00),
('440e8400-e29b-41d4-a716-446655440005', '330e8400-e29b-41d4-a716-446655440002', '110e8400-e29b-41d4-a716-446655440005', 1, 799.00, 799.00),
('440e8400-e29b-41d4-a716-446655440006', '330e8400-e29b-41d4-a716-446655440002', '110e8400-e29b-41d4-a716-446655440006', 1, 599.00, 599.00),

-- INV-RTL-2024-003 items
('440e8400-e29b-41d4-a716-446655440007', '330e8400-e29b-41d4-a716-446655440003', '110e8400-e29b-41d4-a716-446655440006', 2, 599.00, 1198.00),
('440e8400-e29b-41d4-a716-446655440008', '330e8400-e29b-41d4-a716-446655440003', '110e8400-e29b-41d4-a716-446655440007', 1, 599.00, 599.00),

-- INV-RTL-2024-004 items
('440e8400-e29b-41d4-a716-446655440009', '330e8400-e29b-41d4-a716-446655440004', '110e8400-e29b-41d4-a716-446655440003', 1, 999.00, 999.00),
('440e8400-e29b-41d4-a716-446655440010', '330e8400-e29b-41d4-a716-446655440004', '110e8400-e29b-41d4-a716-446655440008', 1, 1299.00, 1299.00),
('440e8400-e29b-41d4-a716-446655440011', '330e8400-e29b-41d4-a716-446655440004', '110e8400-e29b-41d4-a716-446655440009', 1, 1299.00, 1299.00),

-- INV-RTL-2024-005 items
('440e8400-e29b-41d4-a716-446655440012', '330e8400-e29b-41d4-a716-446655440005', '110e8400-e29b-41d4-a716-446655440001', 3, 399.00, 1197.00),
('440e8400-e29b-41d4-a716-446655440013', '330e8400-e29b-41d4-a716-446655440005', '110e8400-e29b-41d4-a716-446655440002', 2, 399.00, 798.00),
('440e8400-e29b-41d4-a716-446655440014', '330e8400-e29b-41d4-a716-446655440005', '110e8400-e29b-41d4-a716-446655440003', 2, 999.00, 1998.00),

-- INV-RTL-2024-006 items
('440e8400-e29b-41d4-a716-446655440015', '330e8400-e29b-41d4-a716-446655440006', '110e8400-e29b-41d4-a716-446655440004', 1, 799.00, 799.00),
('440e8400-e29b-41d4-a716-446655440016', '330e8400-e29b-41d4-a716-446655440006', '110e8400-e29b-41d4-a716-446655440005', 1, 799.00, 799.00),
('440e8400-e29b-41d4-a716-446655440017', '330e8400-e29b-41d4-a716-446655440006', '110e8400-e29b-41d4-a716-446655440006', 1, 599.00, 599.00),

-- INV-RTL-2024-007 items
('440e8400-e29b-41d4-a716-446655440018', '330e8400-e29b-41d4-a716-446655440007', '110e8400-e29b-41d4-a716-446655440008', 2, 1299.00, 2598.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================
-- This script creates:
-- - 4 Suppliers with various payment terms
-- - 10 Wholesale Products (with expenses and GST)
-- - 5 Purchase Orders (3 received, 2 pending)
-- - 17 Purchase Order Items
-- - 5 Payments to Suppliers
-- - 10 Credit Ledger Entries (supplier balances)
-- - 4 Wholesale Buyers
-- - 6 Wholesale Sales (2 paid, 2 pending, 2 partial)
-- - 21 Wholesale Sales Items
-- - 5 Buyer Payments
-- - 11 Buyer Credit Ledger Entries
-- - 9 Retail Products
-- - 5 Retail Customers
-- - 7 Retail Sales (3 paid, 2 pending, 1 partial, 1 paid)
-- - 18 Retail Sales Items

-- Expected Report Results:
-- B2B Sales: Total Revenue ~₹380,750, with profit calculations
-- B2C Sales: Total Revenue ~₹18,640, with profit calculations
-- Supplier Payables: ~₹75,000 outstanding
-- Buyer Receivables: ~₹136,000 outstanding

