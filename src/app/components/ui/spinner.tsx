import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
// import { parseFloat } from "zod"

export function Spinner({ className, type, runTimer = false }: React.ComponentProps<"loader2">) {
    const [timer, setTimer] = useState(0)
    let interval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (runTimer) {
            interval = setInterval(() => {
                setTimer(parseFloat((timer + .1).toFixed(2)))
            }, 100)
            return () => clearInterval(interval)
        } else {
            if (interval.current) {
                clearInterval(interval.current)
                interval.current = null
            }
        }
    }, [runTimer, timer])
    
    return (
        <div>
            <Loader2 className={cn("w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin relative", className)} />
            <span className="text-xs sm:text-sm text-muted-foreground">{timer} seconds</span>
        </div>
       
    )
}