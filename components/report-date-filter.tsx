"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function ReportDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentMonth = searchParams.get("month") || new Date().getMonth() + 1
  const currentYear = searchParams.get("year") || new Date().getFullYear()
  const filterType = searchParams.get("filter") || "all"

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (type === "filter") {
      params.set("filter", value)
      // Reset month/year when changing filter type
      if (value === "all") {
        params.delete("month")
        params.delete("year")
        params.delete("quarter")
        params.delete("startDate")
        params.delete("endDate")
      } else if (value === "month") {
        params.set("month", String(new Date().getMonth() + 1))
        params.set("year", String(new Date().getFullYear()))
        params.delete("quarter")
        params.delete("startDate")
        params.delete("endDate")
      } else if (value === "year") {
        params.set("year", String(new Date().getFullYear()))
        params.delete("month")
        params.delete("quarter")
        params.delete("startDate")
        params.delete("endDate")
      } else if (value === "quarter") {
        params.set("quarter", "Q1")
        params.set("year", String(new Date().getFullYear()))
        params.delete("month")
        params.delete("startDate")
        params.delete("endDate")
      }
    } else if (type === "month") {
      params.set("month", value)
      params.set("filter", "month")
    } else if (type === "year") {
      params.set("year", value)
      const currentFilter = params.get("filter") || "month"
      if (currentFilter === "quarter") {
        // Keep quarter filter when year changes
        params.set("filter", "quarter")
      } else {
        params.set("filter", "month")
      }
    } else if (type === "quarter") {
      params.set("quarter", value)
      params.set("filter", "quarter")
      if (!params.get("year")) {
        params.set("year", String(new Date().getFullYear()))
      }
    }
    
    router.push(`?${params.toString()}`)
  }

  // Generate month options
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  // Generate year options (current year and 5 years back)
  const currentYearNum = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYearNum - i)

  return (
    <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="filterType" className="mb-2 block">Filter By</Label>
        <Select value={filterType} onValueChange={(value) => handleFilterChange("filter", value)}>
          <SelectTrigger id="filterType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="month">By Month</SelectItem>
            <SelectItem value="year">By Year</SelectItem>
            <SelectItem value="quarter">By Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterType === "month" && (
        <>
          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="month" className="mb-2 block">Month</Label>
            <Select value={String(currentMonth)} onValueChange={(value) => handleFilterChange("month", value)}>
              <SelectTrigger id="month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="year" className="mb-2 block">Year</Label>
            <Select value={String(currentYear)} onValueChange={(value) => handleFilterChange("year", value)}>
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {filterType === "year" && (
        <div className="flex-1 min-w-[120px]">
          <Label htmlFor="yearOnly" className="mb-2 block">Year</Label>
          <Select 
            value={String(currentYear)} 
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("year", value)
              params.set("filter", "year")
              router.push(`?${params.toString()}`)
            }}
          >
            <SelectTrigger id="yearOnly">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filterType === "quarter" && (
        <>
          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="quarter" className="mb-2 block">Quarter</Label>
            <Select 
              value={searchParams.get("quarter") || "Q1"} 
              onValueChange={(value) => handleFilterChange("quarter", value)}
            >
              <SelectTrigger id="quarter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="quarterYear" className="mb-2 block">Year</Label>
            <Select value={String(currentYear)} onValueChange={(value) => handleFilterChange("year", value)}>
              <SelectTrigger id="quarterYear">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  )
}

