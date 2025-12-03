"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DeletePaymentButton({ 
  paymentId, 
  purchaseOrderId 
}: { 
  paymentId: string,
  purchaseOrderId?: string 
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleDelete = async (deleteType: 'transaction' | 'purchase_order') => {
    console.log("=== DELETE HANDLER CALLED ===");
    console.log("Delete type:", deleteType);
    console.log("Payment ID:", paymentId);
    console.log("Purchase Order ID:", purchaseOrderId);
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      console.log("Supabase client created");
      
      if (deleteType === 'transaction') {
        console.log("=== Starting transaction deletion process ===");
        console.log("Payment ID to delete:", paymentId);
        
        // First, get the payment details before deleting
        // Use maybeSingle() instead of single() to avoid PGRST116 error
        console.log("Fetching payment details...");
        const { data: payment, error: fetchError } = await supabase
          .from("payments")
          .select("supplier_id, amount")
          .eq("id", paymentId)
          .maybeSingle();
        
        console.log("Payment fetch result:", { payment, fetchError });
        
        // Handle case where payment is already deleted
        if (fetchError) {
          console.error("Error fetching payment:", fetchError);
          // Still attempt to delete credit ledger entries to clean up any orphaned records
          await cleanupOrphanedCreditLedgerEntries(supabase, paymentId);
          alert("Payment was already deleted or not found. Cleaned up related records.");
          router.push('/dashboard/credit-ledger');
          return;
        }
        
        // Handle case where payment doesn't exist
        if (!payment) {
          console.log("Payment not found, cleaning up any orphaned credit ledger entries");
          // Still attempt to delete credit ledger entries to clean up any orphaned records
          await cleanupOrphanedCreditLedgerEntries(supabase, paymentId);
          alert("Payment was already deleted or not found. Cleaned up related records.");
          router.push('/dashboard/credit-ledger');
          return;
        }
        
        console.log("Found payment for supplier:", payment.supplier_id);
        
        // Check if there are credit ledger entries for this payment BEFORE deletion
        console.log("Checking for existing credit ledger entries...");
        const { data: existingLedgerEntries, error: ledgerQueryError } = await supabase
          .from("credit_ledger")
          .select("*")
          .eq("reference_id", paymentId)
          .eq("reference_type", "payment");
        
        console.log("Existing ledger entries before deletion:", { existingLedgerEntries, ledgerQueryError });
        
        if (ledgerQueryError) {
          console.error("Error querying credit ledger entries:", ledgerQueryError);
        } else {
          console.log("Found existing credit ledger entries before deletion:", existingLedgerEntries);
        }

        // Store the credit ledger entry IDs for direct deletion
        let creditLedgerEntryIds: string[] = [];
        if (existingLedgerEntries && existingLedgerEntries.length > 0) {
          creditLedgerEntryIds = existingLedgerEntries.map(entry => entry.id);
          console.log("Credit ledger entry IDs to delete:", creditLedgerEntryIds);
        }

        // Log detailed information about the existing ledger entries
        if (existingLedgerEntries && existingLedgerEntries.length > 0) {
          console.log("Detailed ledger entries:");
          existingLedgerEntries.forEach((entry, index) => {
            console.log(`Entry ${index}:`, {
              id: entry.id,
              reference_id: entry.reference_id,
              reference_type: entry.reference_type,
              description: entry.description,
              transaction_type: entry.transaction_type,
              amount: entry.amount
            });
          });
        }

        // Delete credit ledger entries FIRST (before deleting the payment)
        // This ensures they're deleted even if the database trigger doesn't work
        console.log("Deleting credit ledger entries for payment:", paymentId);
        
        // Strategy 1: Delete by entry IDs directly (most reliable)
        if (existingLedgerEntries && existingLedgerEntries.length > 0) {
          const entryIds = existingLedgerEntries.map(entry => entry.id);
          console.log("Deleting credit ledger entries by ID:", entryIds);
          
          const { data: deletedByIds, error: deleteByIdError } = await supabase
            .from("credit_ledger")
            .delete()
            .in("id", entryIds)
            .select();
          
          if (deleteByIdError) {
            console.error("Error deleting credit ledger entries by ID:", deleteByIdError);
            console.error("Error details:", JSON.stringify(deleteByIdError, null, 2));
            // Continue to try alternative method
          } else {
            console.log("Successfully deleted credit ledger entries by ID:", deletedByIds?.length || 0, "entries");
          }
        }
        
        // Strategy 2: Delete by reference_id and reference_type (backup method)
        console.log("Attempting to delete credit ledger entries by reference_id and reference_type...");
        const { data: deletedByReference, error: deleteByReferenceError } = await supabase
          .from("credit_ledger")
          .delete()
          .eq("reference_id", paymentId)
          .eq("reference_type", "payment")
          .select();
        
        if (deleteByReferenceError) {
          console.error("Error deleting credit ledger entries by reference:", deleteByReferenceError);
          console.error("Error details:", JSON.stringify(deleteByReferenceError, null, 2));
          // This might fail due to RLS, but we'll verify after
        } else {
          console.log("Successfully deleted credit ledger entries by reference:", deletedByReference?.length || 0, "entries");
        }
        
        // Verify deletion was successful
        console.log("Verifying credit ledger entries were deleted...");
        const { data: remainingEntries, error: verifyError } = await supabase
          .from("credit_ledger")
          .select("id, reference_id, reference_type")
          .eq("reference_id", paymentId)
          .eq("reference_type", "payment");
        
        if (verifyError) {
          console.error("Error verifying deletion:", verifyError);
        } else if (remainingEntries && remainingEntries.length > 0) {
          console.warn("WARNING: Some credit ledger entries still exist after deletion attempt:", remainingEntries);
          // Try one more time with direct ID deletion
          const remainingIds = remainingEntries.map(e => e.id);
          console.log("Attempting final deletion of remaining entries by ID:", remainingIds);
          const { error: finalDeleteError } = await supabase
            .from("credit_ledger")
            .delete()
            .in("id", remainingIds);
          
          if (finalDeleteError) {
            console.error("Final deletion attempt failed:", finalDeleteError);
            throw new Error("Failed to delete all credit ledger entries. Some entries may still exist. Error: " + finalDeleteError.message);
          } else {
            console.log("Successfully deleted remaining entries in final attempt");
          }
        } else {
          console.log("✓ Verification passed: All credit ledger entries deleted successfully");
        }
        
        // Final check: If we found entries initially, make sure they're all gone before proceeding
        if (existingLedgerEntries && existingLedgerEntries.length > 0) {
          const { data: finalCheck, error: finalCheckError } = await supabase
            .from("credit_ledger")
            .select("id")
            .eq("reference_id", paymentId)
            .eq("reference_type", "payment");
          
          if (finalCheckError) {
            console.error("Error in final check:", finalCheckError);
            throw new Error("Cannot verify credit ledger deletion. Aborting payment deletion to prevent data inconsistency.");
          }
          
          if (finalCheck && finalCheck.length > 0) {
            const errorMsg = `Cannot delete payment: ${finalCheck.length} credit ledger entries still exist. This may be due to Row Level Security (RLS) policies. Please ensure DELETE policy exists for credit_ledger table.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
          }
          
          console.log("✓ Final verification: All credit ledger entries confirmed deleted");
        }

        // Now delete the payment transaction
        console.log("Attempting to delete payment from database...");
        const { error: deletePaymentError } = await supabase
          .from("payments")
          .delete()
          .eq("id", paymentId);
        
        console.log("Payment deletion result:", { deletePaymentError });

        if (deletePaymentError) {
          console.error("Error deleting payment:", deletePaymentError);
          throw new Error("Failed to delete payment: " + deletePaymentError.message);
        }
        console.log("Payment deleted successfully");

        // Recalculate the supplier's credit ledger balance
        console.log("Recalculating balance for supplier:", payment.supplier_id);
        await recalculateSupplierBalance(supabase, payment.supplier_id);

      } else if (deleteType === 'purchase_order' && purchaseOrderId) {
        console.log("Deleting entire purchase order:", purchaseOrderId);
        
        // Get the supplier ID from the purchase order
        // Use maybeSingle() instead of single() to avoid PGRST116 error
        const { data: po, error: poError } = await supabase
          .from("purchase_orders")
          .select("supplier_id")
          .eq("id", purchaseOrderId)
          .maybeSingle();
        
        if (poError) {
          console.error("Error fetching purchase order:", poError);
          throw new Error("Purchase order not found or already deleted");
        }
        
        if (!po) {
          throw new Error("Purchase order not found");
        }
        
        console.log("Found purchase order for supplier:", po.supplier_id);
        
        // Delete the entire purchase order
        const { error: poDeleteError } = await supabase
          .from("purchase_orders")
          .delete()
          .eq("id", purchaseOrderId);
        
        if (poDeleteError) {
          console.error("Error deleting purchase order:", poDeleteError);
          throw new Error("Failed to delete purchase order: " + poDeleteError.message);
        }
        console.log("Purchase order deleted successfully");
        
        // Get all related payments before deleting them
        const { data: relatedPayments } = await supabase
          .from("payments")
          .select("id")
          .eq("purchase_order_id", purchaseOrderId);
        
        console.log("Found related payments to delete:", relatedPayments);
        
        // Delete all related payments
        const { error: paymentsDeleteError } = await supabase
          .from("payments")
          .delete()
          .eq("purchase_order_id", purchaseOrderId);
        
        if (paymentsDeleteError) {
          console.error("Error deleting related payments:", paymentsDeleteError);
          throw new Error("Failed to delete related payments: " + paymentsDeleteError.message);
        }
        console.log("Related payments deleted successfully");
        
        // Delete all related credit ledger entries for the purchase order
        const { data: poLedgerEntries, error: poLedgerDeleteError } = await supabase
          .from("credit_ledger")
          .delete()
          .eq("reference_id", purchaseOrderId)
          .eq("reference_type", "purchase_order")
          .select();
        
        if (poLedgerDeleteError) {
          console.error("Error deleting purchase order ledger entries:", poLedgerDeleteError);
          throw new Error("Failed to delete purchase order ledger entries: " + poLedgerDeleteError.message);
        }
        console.log("Deleted purchase order ledger entries:", poLedgerEntries);
        
        // Additional safeguard for purchase order: Delete any ledger entries that might reference this PO by description
        if (poLedgerEntries && poLedgerEntries.length > 0) {
          // Only exclude already deleted entries if there are any
          const deletedIds = poLedgerEntries.map((e: any) => e.id).filter(Boolean);
          if (deletedIds.length > 0) {
            // Build a string of excluded IDs for the not.in operator
            const excludedIdsString = deletedIds.map(id => `'${id}'`).join(',');
            const { data: additionalPOLedgerEntries, error: additionalPODeleteError } = await supabase
              .from("credit_ledger")
              .delete()
              .ilike("description", `%${purchaseOrderId}%`)
              .eq("reference_type", "purchase_order")
              .not("id", "in", `(${excludedIdsString})`)
              .select();
            
            if (additionalPODeleteError) {
              console.error("Error deleting additional purchase order ledger entries:", additionalPODeleteError);
            } else if (additionalPOLedgerEntries && additionalPOLedgerEntries.length > 0) {
              console.log("Deleted additional purchase order ledger entries:", additionalPOLedgerEntries);
            }
          } else {
            // If no valid IDs to exclude, just do a general search and delete
            const { data: additionalPOLedgerEntries, error: additionalPODeleteError } = await supabase
              .from("credit_ledger")
              .delete()
              .ilike("description", `%${purchaseOrderId}%`)
              .eq("reference_type", "purchase_order")
              .select();
            
            if (additionalPODeleteError) {
              console.error("Error deleting additional purchase order ledger entries:", additionalPODeleteError);
            } else if (additionalPOLedgerEntries && additionalPOLedgerEntries.length > 0) {
              console.log("Deleted additional purchase order ledger entries:", additionalPOLedgerEntries);
            }
          }
        } else {
          // If no entries were deleted in the first step, do a general search and delete
          const { data: additionalPOLedgerEntries, error: additionalPODeleteError } = await supabase
            .from("credit_ledger")
            .delete()
            .ilike("description", `%${purchaseOrderId}%`)
            .eq("reference_type", "purchase_order")
            .select();
          
          if (additionalPODeleteError) {
            console.error("Error deleting additional purchase order ledger entries:", additionalPODeleteError);
          } else if (additionalPOLedgerEntries && additionalPOLedgerEntries.length > 0) {
            console.log("Deleted additional purchase order ledger entries:", additionalPOLedgerEntries);
          }
        }
        
        // Delete all related credit ledger entries for related payments
        if (relatedPayments && relatedPayments.length > 0) {
          const paymentIds = relatedPayments.map((p: any) => p.id);
          const { data: paymentLedgerEntries, error: paymentLedgerDeleteError } = await supabase
            .from("credit_ledger")
            .delete()
            .in("reference_id", paymentIds)
            .eq("reference_type", "payment")
            .select();
          
          if (paymentLedgerDeleteError) {
            console.error("Error deleting payment ledger entries:", paymentLedgerDeleteError);
            throw new Error("Failed to delete payment ledger entries: " + paymentLedgerDeleteError.message);
          }
          console.log("Deleted payment ledger entries:", paymentLedgerEntries);
          
          // Additional safeguard: Delete any ledger entries that might reference these payments by description
          // Collect all deleted entry IDs to exclude them from this additional search
          const allDeletedEntryIds: string[] = [];
          if (paymentLedgerEntries) {
            allDeletedEntryIds.push(...paymentLedgerEntries.map((e: any) => e.id).filter(Boolean));
          }
          
          // For each payment, we need to make a separate call since ilike doesn't support arrays
          let additionalPaymentLedgerEntries: any[] = [];
          for (const payment of relatedPayments) {
            const { data: paymentEntries, error: paymentEntryError } = await supabase
              .from("credit_ledger")
              .delete()
              .ilike("description", `%${payment.id}%`)
              .eq("reference_type", "payment")
              .not("id", "in", `(${allDeletedEntryIds.length > 0 ? allDeletedEntryIds.map(id => `'${id}'`).join(',') : "'00000000-0000-0000-0000-000000000000'"})`)
              .select();
            
            if (paymentEntryError) {
              console.error("Error deleting additional payment ledger entries for payment", payment.id, ":", paymentEntryError);
            } else if (paymentEntries && paymentEntries.length > 0) {
              additionalPaymentLedgerEntries = [...additionalPaymentLedgerEntries, ...paymentEntries];
            }
          }
          
          if (additionalPaymentLedgerEntries.length > 0) {
            console.log("Deleted additional payment ledger entries:", additionalPaymentLedgerEntries);
          }
        }        
        // Recalculate the supplier's credit ledger balance
        console.log("Recalculating balance for supplier:", po.supplier_id);
        await recalculateSupplierBalance(supabase, po.supplier_id);
      }
      
      // Navigate back to the main credit ledger page to ensure fresh data is loaded
      console.log("Navigating back to credit ledger page");
      router.push('/dashboard/credit-ledger')
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert(error instanceof Error ? error.message : "Failed to delete payment")
    } finally {
      setIsLoading(false)
      setShowDialog(false)
    }
  }

  // Function to recalculate supplier's credit ledger balance
  const recalculateSupplierBalance = async (supabase: ReturnType<typeof createClient>, supplierId: string) => {
    console.log("=== Recalculating supplier balance ===");
    console.log("Supplier ID:", supplierId);
    
    // Get all credit ledger entries for this supplier ordered by creation date
    console.log("Fetching credit ledger entries for supplier...");
    const { data: entries, error } = await supabase
      .from("credit_ledger")
      .select("id, transaction_type, amount")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching credit ledger entries:", error);
      throw new Error("Failed to fetch credit ledger entries: " + error.message);
    }

    console.log("Found", entries?.length || 0, "entries for supplier", supplierId);

    // Recalculate balances
    let runningBalance = 0;
    console.log("Recalculating balances...");
    for (const entry of entries || []) {
      if (entry.transaction_type === "credit") {
        runningBalance += Number(entry.amount || 0);
        console.log(`Entry ${entry.id}: Adding credit ${entry.amount || 0}, running balance: ${runningBalance}`);
      } else if (entry.transaction_type === "debit") {
        runningBalance -= Number(entry.amount || 0);
        console.log(`Entry ${entry.id}: Subtracting debit ${entry.amount || 0}, running balance: ${runningBalance}`);
      }

      // Update the balance_after field
      console.log(`Updating balance for entry ${entry.id} to ${runningBalance}`);
      const { error: updateError } = await supabase
        .from("credit_ledger")
        .update({ balance_after: runningBalance })
        .eq("id", entry.id);

      if (updateError) {
        console.error("Error updating balance for entry", entry.id, ":", updateError);
      }
    }

    console.log("Finished balance recalculation for supplier:", supplierId, "Final balance:", runningBalance);

    // Additional verification: Check for any orphaned entries
    console.log("Checking for orphaned entries...");
    const { data: orphanedEntries } = await supabase
      .from("credit_ledger")
      .select("*")
      .eq("supplier_id", supplierId)
      .or("reference_type.eq.payment,reference_type.eq.purchase_order");

    if (orphanedEntries) {
      console.log("Found", orphanedEntries.length, "potential orphaned entries");
      // Verify that all reference_ids actually exist in their respective tables
      for (const entry of orphanedEntries) {
        if (entry.reference_type === "payment") {
          // Use maybeSingle() instead of single() to avoid PGRST116 error
          const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .select("id")
            .eq("id", entry.reference_id)
            .maybeSingle();

          if (paymentError) {
            console.error("Error checking payment existence:", paymentError);
          } else if (!payment) {
            console.warn("Orphaned payment ledger entry found:", entry);
          }
        } else if (entry.reference_type === "purchase_order") {
          // Use maybeSingle() instead of single() to avoid PGRST116 error
          const { data: po, error: poError } = await supabase
            .from("purchase_orders")
            .select("id")
            .eq("id", entry.reference_id)
            .maybeSingle();

          if (poError) {
            console.error("Error checking purchase order existence:", poError);
          } else if (!po) {
            console.warn("Orphaned purchase order ledger entry found:", entry);
          }
        }
      }
    } else {
      console.log("No potential orphaned entries found");
    }
  };

  // Function to clean up orphaned credit ledger entries
  const cleanupOrphanedCreditLedgerEntries = async (supabase: ReturnType<typeof createClient>, paymentId: string) => {
    console.log("=== Cleaning up orphaned credit ledger entries ===");
    console.log("Payment ID:", paymentId);
    
    // Delete credit ledger entries that reference this payment ID
    console.log("Deleting credit ledger entries by reference_id...");
    const { data: deletedEntries, error: deleteError } = await supabase
      .from("credit_ledger")
      .delete()
      .eq("reference_id", paymentId)
      .eq("reference_type", "payment")
      .select();
    
    if (deleteError) {
      console.error("Error deleting orphaned credit ledger entries:", deleteError);
    } else {
      console.log("Deleted orphaned credit ledger entries:", deletedEntries);
    }
    
    // Additional cleanup: Delete entries that might reference this payment by description
    console.log("Deleting credit ledger entries by description...");
    const { data: additionalDeletedEntries, error: additionalDeleteError } = await supabase
      .from("credit_ledger")
      .delete()
      .ilike("description", `%${paymentId}%`)
      .eq("reference_type", "payment")
      .select();
    
    if (additionalDeleteError) {
      console.error("Error deleting additional orphaned credit ledger entries:", additionalDeleteError);
    } else if (additionalDeletedEntries && additionalDeletedEntries.length > 0) {
      console.log("Deleted additional orphaned credit ledger entries:", additionalDeletedEntries);
    }
    
    // Final verification that all entries are deleted
    console.log("Verifying cleanup...");
    const { data: remainingEntries } = await supabase
      .from("credit_ledger")
      .select("*")
      .eq("reference_id", paymentId)
      .eq("reference_type", "payment");
    
    if (remainingEntries && remainingEntries.length > 0) {
      console.warn("Warning: Some credit ledger entries still remain after cleanup:", remainingEntries);
    } else {
      console.log("Successfully cleaned up all credit ledger entries for payment:", paymentId);
    }
  };

  return (
    <>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => setShowDialog(true)} 
        disabled={isLoading}
      >
        {isLoading ? "Deleting..." : "Delete"}
      </Button>
      
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              What would you like to delete?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDelete('transaction')}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Transaction Only
            </AlertDialogAction>
            {purchaseOrderId && (
              <AlertDialogAction 
                onClick={() => handleDelete('purchase_order')}
                className="bg-destructive hover:bg-destructive/90 ml-2"
              >
                Delete Entire Purchase Order
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}