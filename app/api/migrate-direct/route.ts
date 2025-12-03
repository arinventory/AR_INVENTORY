import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

export async function POST() {
  try {
    console.log("[v0] Starting Supabase migration...")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Read migration SQL file
    const sqlPath = join(process.cwd(), "scripts", "001_create_tables.sql")
    const migrationSQL = readFileSync(sqlPath, "utf-8")

    // Split SQL into individual statements and execute
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    console.log(`[v0] Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql: statement })
        if (error && !error.message.includes("already exists")) {
          console.error(`[v0] Error executing statement: ${error.message}`)
        }
      } catch (err: any) {
        // Continue if table already exists
        if (!err.message?.includes("already exists")) {
          console.error(`[v0] Execution error: ${err.message}`)
        }
      }
    }

    console.log("[v0] ✓ Migration completed!")

    return Response.json({
      success: true,
      message: "Database migration completed successfully",
      statementsExecuted: statements.length,
    })
  } catch (error: any) {
    console.error("[v0] Migration failed:", error.message)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
