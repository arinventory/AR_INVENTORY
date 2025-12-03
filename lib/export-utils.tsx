export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          if (value === null || value === undefined) return ""
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`
          }
          return value
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generatePDFContent(title: string, data: any[], columns: string[]): string {
  const timestamp = new Date().toLocaleString()
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .timestamp { color: #666; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #2563eb; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .total-row { font-weight: bold; background-color: #f3f4f6; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="timestamp">Generated on: ${timestamp}</div>
      <table>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${columns.map((col) => `<td>${row[col] || ""}</td>`).join("")}
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `
  return html
}

export function downloadPDF(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.html`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportToExcel(data: any[], filename: string, sheetName: string = "Sheet1") {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  try {
    // Dynamic import to avoid SSR issues
    const XLSX = await import("xlsx")
    
    // Create a new workbook
    const wb = XLSX.utils.book_new()
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Write file
    XLSX.writeFile(wb, `${filename}.xlsx`)
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    alert("Error exporting to Excel. Please try again.")
  }
}
