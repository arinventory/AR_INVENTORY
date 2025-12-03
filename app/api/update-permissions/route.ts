import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    console.log("[v0] Updating database permissions...")
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Add missing UPDATE and DELETE policies for payments table
    const updatePolicySql = `
      DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.payments;
      CREATE POLICY "Enable update for authenticated users" ON public.payments
        FOR UPDATE USING (auth.role() = 'authenticated');
      
      DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.payments;
      CREATE POLICY "Enable delete for authenticated users" ON public.payments
        FOR DELETE USING (auth.role() = 'authenticated');
    `

    const { error } = await supabase.rpc("exec_sql", { sql: updatePolicySql })
    
    if (error) {
      console.error("[v0] Error updating permissions:", error.message)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] ✓ Permissions updated successfully!")
    
    return Response.json({
      success: true,
      message: "Database permissions updated successfully"
    })
  } catch (error: any) {
    console.error("[v0] Permission update failed:", error.message)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}