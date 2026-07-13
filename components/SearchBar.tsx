"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect, useState } from "react"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const debounced = useDebounce(value, 300)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debounced) {
      params.set("q", debounced)
    } else {
      params.delete("q")
    }
    params.delete("page")
    router.push(`/?${params.toString()}`)
  }, [debounced])

  return (
    <Input
      placeholder="Buscar juegos..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="max-w-sm"
    />
  )
}
