"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Country codes list with commonly used countries first
export const COUNTRY_CODES = [
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+33", country: "Francia", flag: "🇫🇷" },
  { code: "+49", country: "Alemania", flag: "🇩🇪" },
  { code: "+39", country: "Italia", flag: "🇮🇹" },
  { code: "+81", country: "Japón", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
]

export interface PhoneInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  countryCode?: string
  onCountryCodeChange?: (code: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  selectClassName?: string
  inputClassName?: string
  size?: "default" | "sm"
  error?: boolean
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      id,
      value,
      onChange,
      countryCode: externalCountryCode,
      onCountryCodeChange,
      placeholder = "300 123 4567",
      required = false,
      disabled = false,
      className,
      selectClassName,
      inputClassName,
      size = "default",
      error = false,
    },
    ref
  ) => {
    const [internalCountryCode, setInternalCountryCode] = React.useState("+57")

    // Use external country code if provided, otherwise use internal state
    const currentCountryCode = externalCountryCode !== undefined ? externalCountryCode : internalCountryCode

    const handleCountryCodeChange = (code: string) => {
      if (onCountryCodeChange) {
        onCountryCodeChange(code)
      } else {
        setInternalCountryCode(code)
      }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits and spaces
      const sanitized = e.target.value.replace(/[^\d\s]/g, "")
      onChange(sanitized)
    }

    const selectWidth = size === "sm" ? "w-[110px]" : "w-[120px]"
    const inputSize = size === "sm" ? "h-9 text-sm" : ""
    const selectSize = size === "sm" ? "h-9 text-sm" : ""

    return (
      <div className={cn("flex gap-2", className)}>
        <Select value={currentCountryCode} onValueChange={handleCountryCodeChange} disabled={disabled}>
          <SelectTrigger className={cn(selectWidth, selectSize, error && "border-destructive", selectClassName)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.flag} {item.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          id={id}
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={handlePhoneChange}
          required={required}
          disabled={disabled}
          className={cn("flex-1", inputSize, error && "border-destructive", inputClassName)}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

// Utility function to combine country code with phone number
export const formatFullPhoneNumber = (countryCode: string, phoneNumber: string): string => {
  return `${countryCode}${phoneNumber.replace(/^[\s+]+/, "")}`
}
