"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [b2bOpen, setB2bOpen] = useState(true)
  const [b2bSupplierOpen, setB2bSupplierOpen] = useState(true)
  const [b2bBuyerOpen, setB2bBuyerOpen] = useState(true)
  const [b2cOpen, setB2cOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(256) // 256px = 64 tailwind units
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Load saved width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth')
    if (savedWidth) {
      setSidebarWidth(Math.max(200, Math.min(500, parseInt(savedWidth))))
    }
  }, [])

  // Save width to localStorage when it changes
  useEffect(() => {
    if (sidebarWidth) {
      localStorage.setItem('sidebarWidth', sidebarWidth.toString())
    }
  }, [sidebarWidth])

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && sidebarRef.current) {
        const newWidth = Math.max(200, Math.min(500, e.clientX))
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
  ]

  const b2bItems = [
    { href: "/dashboard/b2b", label: "B2B Dashboard", icon: "🏭" },
  ]

  const b2bSupplierItems = [
    { href: "/dashboard/suppliers", label: "Suppliers", icon: "A" },
    { href: "/dashboard/wholesale-products", label: "Wholesale Products", icon: "B" },
    { href: "/dashboard/purchase-orders", label: "Purchase Orders", icon: "C" },
    { href: "/dashboard/payments", label: "Pay Supplier Bills", icon: "D" },
    { href: "/dashboard/credit-ledger", label: "Credit Ledger", icon: "E" },
  ]

  const b2bBuyerItems = [
    { href: "/dashboard/b2b-sales", label: "B2B Sales", icon: "A" },
    { href: "/dashboard/buyer-payments", label: "Buyer Payments", icon: "B" },
    { href: "/dashboard/buyer-credit-ledger", label: "Buyer Credit Ledger", icon: "C" },
    { href: "/dashboard/wholesale-buyers", label: "Wholesale Buyers", icon: "D" },
  ]

  const b2cItems = [
    { href: "/dashboard/b2c", label: "B2C Dashboard", icon: "🛍️" },
  ]

  const b2cSubItems = [
    { href: "/dashboard/retail-products", label: "Retail Products", icon: "A" },
    { href: "/dashboard/sales", label: "Sales", icon: "B" },
    { href: "/dashboard/customers", label: "Customers", icon: "C" },
  ]

  return (
    <aside 
      ref={sidebarRef}
      className="bg-primary text-primary-foreground flex flex-col border-r relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize bg-primary-foreground/20 hover:bg-primary-foreground/40 flex items-center justify-center"
        onMouseDown={startResizing}
      >
        <GripVertical className="text-primary-foreground/60" size={16} />
      </div>

      <div className="p-6 border-b border-primary-foreground/20">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-base text-primary-foreground/90 mt-1">Management System</p>
      </div>

      <nav className="flex-1 overflow-auto p-4 space-y-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start h-12 text-lg">
              <span className="mr-3 text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Button>
          </Link>
        ))}

        {/* B2B Section */}
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start font-bold text-xl h-12"
            onClick={() => setB2bOpen(!b2bOpen)}
          >
            {b2bOpen ? <ChevronDown className="mr-3 h-5 w-5" /> : <ChevronRight className="mr-3 h-5 w-5" />}
            <span className="mr-3 text-xl">🏭</span>
            B2B
          </Button>
          {b2bOpen && (
            <div className="ml-6 space-y-2 mt-2">
              {/* B2B Dashboard Link */}
              <Link href="/dashboard/b2b">
                <Button variant={pathname === "/dashboard/b2b" ? "secondary" : "ghost"} className="w-full justify-start h-10 text-base">
                  <span className="mr-3">📊</span>
                  B2B Dashboard
                </Button>
              </Link>
              
              {/* B2B Supplier Subsection */}
              <div className="mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start font-semibold text-lg h-10"
                  onClick={() => setB2bSupplierOpen(!b2bSupplierOpen)}
                >
                  {b2bSupplierOpen ? <ChevronDown className="mr-3 h-4 w-4" /> : <ChevronRight className="mr-3 h-4 w-4" />}
                  Supplier
                </Button>
                {b2bSupplierOpen && (
                  <div className="ml-6 mt-2 space-y-1">
                    {b2bSupplierItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start h-9 text-base">
                          <span className="mr-3 font-bold">{item.icon}.</span>
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {/* B2B Buyer Subsection */}
              <div className="mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start font-semibold text-lg h-10"
                  onClick={() => setB2bBuyerOpen(!b2bBuyerOpen)}
                >
                  {b2bBuyerOpen ? <ChevronDown className="mr-3 h-4 w-4" /> : <ChevronRight className="mr-3 h-4 w-4" />}
                  Buyer
                </Button>
                {b2bBuyerOpen && (
                  <div className="ml-6 mt-2 space-y-1">
                    {b2bBuyerItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start h-9 text-base">
                          <span className="mr-3 font-bold">{item.icon}.</span>
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* B2C Section */}
        <div className="mt-6">
          <Button
            variant="ghost"
            className="w-full justify-start font-bold text-xl h-12"
            onClick={() => setB2cOpen(!b2cOpen)}
          >
            {b2cOpen ? <ChevronDown className="mr-3 h-5 w-5" /> : <ChevronRight className="mr-3 h-5 w-5" />}
            <span className="mr-3 text-xl">🛍️</span>
            B2C
          </Button>
          {b2cOpen && (
            <div className="ml-6 space-y-2 mt-2">
              {/* B2C Dashboard Link */}
              <Link href="/dashboard/b2c">
                <Button variant={pathname === "/dashboard/b2c" ? "secondary" : "ghost"} className="w-full justify-start h-10 text-base">
                  <span className="mr-3">📊</span>
                  B2C Dashboard
                </Button>
              </Link>
              
              {/* B2C Sub Items */}
              <div className="ml-6 mt-2 space-y-1">
                {b2cSubItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start h-9 text-base">
                      <span className="mr-3 font-bold">{item.icon}.</span>
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className="mt-6">
          <Link href="/dashboard/reports">
            <Button variant={pathname === "/dashboard/reports" ? "secondary" : "ghost"} className="w-full justify-start h-12 text-lg">
              <span className="mr-3 text-xl">📊</span>
              <span className="font-medium">Reports</span>
            </Button>
          </Link>
        </div>

        {/* Diagnostics Section */}
        <div className="mt-6">
          <Link href="/dashboard/diagnostics">
            <Button variant={pathname === "/dashboard/diagnostics" ? "secondary" : "ghost"} className="w-full justify-start h-12 text-lg">
              <span className="mr-3 text-xl">🔧</span>
              <span className="font-medium">Diagnostics</span>
            </Button>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-primary-foreground/20">
        <Button 
          onClick={handleLogout} 
          disabled={isLoggingOut} 
          variant="outline" 
          className="w-full bg-transparent h-12 text-lg"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </aside>
  )
}