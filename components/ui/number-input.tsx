"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface NumberInputProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value?: number | string
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min = 0, max, step = 1, disabled, onBlur, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [internalValue, setInternalValue] = React.useState<number | "">(
      value === undefined || value === "" ? "" : (typeof value === "string" ? (parseInt(value) || "") : value)
    )

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    React.useEffect(() => {
      if (value === undefined || value === "") {
        setInternalValue("")
      } else {
        const numValue = typeof value === "string" ? (parseInt(value) || "") : value
        if (numValue !== internalValue) {
          setInternalValue(numValue)
        }
      }
    }, [value])

    const handleChange = (newValue: number | "") => {
      if (newValue === "") {
        setInternalValue("")
        // Don't call onChange when clearing, keep it empty
        return
      }

      let clampedValue = newValue

      if (min !== undefined && clampedValue < min) {
        clampedValue = min
      }
      if (max !== undefined && clampedValue > max) {
        clampedValue = max
      }

      setInternalValue(clampedValue)
      onChange?.(clampedValue)
    }

    const handleDecrement = () => {
      const currentValue = internalValue === "" ? min : internalValue
      const newValue = currentValue - step
      handleChange(newValue)
    }

    const handleIncrement = () => {
      const currentValue = internalValue === "" ? min : internalValue
      const newValue = currentValue + step
      handleChange(newValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      if (inputValue === "") {
        setInternalValue("")
        onChange?.(min)
        return
      }

      const numValue = parseInt(inputValue)
      if (!isNaN(numValue)) {
        handleChange(numValue)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure value is within bounds on blur, or set to min if empty
      if (internalValue === "") {
        handleChange(min)
      } else if (min !== undefined && internalValue < min) {
        handleChange(min)
      } else if (max !== undefined && internalValue > max) {
        handleChange(max)
      }
      onBlur?.(e)
    }

    return (
      <div className={cn("flex items-center border border-input rounded-md overflow-hidden w-full shadow-sm bg-transparent h-9", className)}>
        <Input
          ref={inputRef}
          type="number"
          value={internalValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="h-full flex-1 border-0 rounded-none text-center px-3 text-base md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          className="h-full w-8 aspect-square min-w-8 flex-shrink-0 rounded-none border-l border-input hover:bg-accent p-0"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && internalValue !== "" && internalValue <= min)}
          aria-label="Wert reduzieren"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-full w-8 aspect-square min-w-8 flex-shrink-0 rounded-none border-l border-input hover:bg-accent p-0"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && internalValue !== "" && internalValue >= max)}
          aria-label="Wert erhöhen"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }

