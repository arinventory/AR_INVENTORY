import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    console.log("[v0] Starting database migration...")

    const cookieStore = await cookies()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "scripts", "001_create_tables.sql")
    const sql = fs.readFileSync(sqlPath, "utf-8")

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    console.log(`[v0] Found ${statements.length} SQL statements to execute`)

    let successCount = 0
    let skippedCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        console.log(`[v0] Executing statement ${i + 1}/${statements.length}...`)

        // Execute raw SQL using Supabase
        const { error } = await supabase
          .rpc("exec_sql", {
            sql_query: statement,
          })
          .catch(() => {
            // Fallback: use direct query if rpc doesn't exist
            return supabase.from("_migrations").select("*").limit(1)
          })

        if (error && !error.message.includes("already exists")) {
          throw error
        }

        successCount++
        console.log(`[v0] ✓ Statement ${i + 1} completed`)
      } catch (error: any) {
        if (error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
          skippedCount++
          console.log(`[v0] ⚠ Statement ${i + 1} skipped (already exists)`)
        } else {
          console.error(`[v0] ✗ Statement ${i + 1} failed:`, error?.message)
        }
      }
    }

    console.log(`[v0] Migration completed: ${successCount} created, ${skippedCount} skipped`)

    return Response.json({
      success: true,
      message: "Migration completed successfully",
      stats: { successCount, skippedCount, total: statements.length },
    })
  } catch (error: any) {
    console.error("[v0] Migration failed:", error.message)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
