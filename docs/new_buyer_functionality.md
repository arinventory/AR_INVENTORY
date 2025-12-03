# New Buyer Functionality

This document explains how the system handles new buyers when creating B2B sales.

## How It Works

1. **Phone Number Entry**: When entering a phone number in the B2B sales form, the system performs a live search against existing buyers in the `wholesale_buyers` table.

2. **Existing Buyer Selection**: If a matching buyer is found, their details are automatically populated in the form.

3. **New Buyer Creation**: If no matching buyer is found, the system allows you to:
   - Enter a new buyer name
   - Enter the phone number (which will be saved)
   - Optionally add address details
   - Save the sale, which will automatically create a new buyer record

## Key Features

### Live Phone Search
- As you type a phone number (minimum 3 digits), the system searches for matching buyers
- Results are displayed in a dropdown for quick selection
- If you select an existing buyer, their details are automatically filled

### New Buyer Handling
- If you enter a phone number that doesn't match any existing buyer, you can still proceed
- The system will create a new buyer record when you save the sale
- The new buyer will be linked to the sale through the `customer_id` field

### Data Consistency
- All buyer information is stored in the `wholesale_buyers` table
- Sales are linked to buyers through the `customer_id` foreign key
- Buyer details are updated if you modify them during sale creation/editing

## Best Practices

1. **Always enter a phone number**: This is used as the primary identifier for buyers
2. **Enter complete buyer details**: Name, address, etc. will be saved for future reference
3. **Check for existing buyers**: The live search helps prevent duplicate entries

## Troubleshooting

### Issue: Buyer not being created
- Ensure both buyer name and phone number are entered
- Check browser console for any JavaScript errors
- Verify database connectivity

### Issue: Duplicate buyers
- Use the live search feature to check if a buyer already exists
- Search by phone number rather than name for more accurate matching

## Database Schema

### wholesale_buyers table
- `id` (UUID): Primary key
- `name` (TEXT): Buyer name
- `phone` (TEXT): Phone number (unique identifier)
- `address` (TEXT): Buyer address
- `city` (TEXT): Buyer city
- `state` (TEXT): Buyer state
- `postal_code` (TEXT): Postal code
- `country` (TEXT): Country

### wholesale_sales table
- `id` (UUID): Primary key
- `customer_id` (UUID): Foreign key to `wholesale_buyers.id`
- `customer_name` (TEXT): Denormalized buyer name
- `customer_phone` (TEXT): Denormalized phone number
- Other sale-related fields...

## Testing New Buyer Creation

To test the new buyer functionality:

1. Navigate to B2B Sales → Create New Sale
2. Enter a phone number that doesn't exist in the system (e.g., 9999999999)
3. Enter a buyer name
4. Add some products to the sale
5. Save the sale
6. Verify that:
   - A new buyer record was created in the `wholesale_buyers` table
   - The sale was created with the correct `customer_id` linking to the new buyer
   - The buyer's phone number matches what you entered