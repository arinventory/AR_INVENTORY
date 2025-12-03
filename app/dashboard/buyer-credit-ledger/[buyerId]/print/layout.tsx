import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import "./print.css"

// This layout completely bypasses the dashboard layout for print pages
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication but don't show sidebar
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data?.user) {
    redirect("/auth/login")
  }

  // Return children without dashboard wrapper - completely standalone for printing
  return (
    <div className="print-content-wrapper bg-white" style={{ visibility: 'visible', display: 'block' }}>
      {children}
    </div>
  )
}