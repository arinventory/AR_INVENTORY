"use client"

export function PrintButtonClient() {
  return (
    <div className="no-print mt-8 text-center">
      <button
        onClick={() => window.print()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md"
      >
        Print Invoice
      </button>
    </div>
  )
}

