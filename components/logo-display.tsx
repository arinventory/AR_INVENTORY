"use client"

export function LogoDisplay() {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <img
        src="/FINAL_LOGO.jpg"
        alt="AR CLOTHING Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          const parent = target.parentElement
          if (parent && !parent.querySelector(".logo-fallback")) {
            const fallback = document.createElement("div")
            fallback.className = "logo-fallback absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700"
            fallback.textContent = "AR CLOTHING"
            parent.appendChild(fallback)
          }
        }}
      />
    </div>
  )
}

