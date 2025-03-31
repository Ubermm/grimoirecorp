//@ts-nocheck
import * as React from "react"
import { createContext, useContext, useState } from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

const ToastContext = createContext<{
  toasts: ToasterToast[]
  addToast: (toast: Omit<ToasterToast, "id">) => void
  removeToast: (id: string) => void
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  const addToast = React.useCallback(
    ({ ...props }: Omit<ToasterToast, "id">) => {
      setToasts((current) => {
        if (current.length >= TOAST_LIMIT) {
          current.pop()
        }
        return [{ id: Math.random().toString(), ...props }, ...current]
      })
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const { addToast } = useContext(ToastContext)
  return {
    toast: addToast,
  }
}

export function Toast({
  className,
  title,
  description,
  action,
  variant = "default",
  ...props
}: ToastPrimitives.ToastProps & {
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}) {
  return (
    <ToastPrimitives.Root
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
        variant === "destructive"
          ? "destructive group border-destructive bg-destructive text-destructive-foreground"
          : "border-border bg-background text-foreground",
        className
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title && <ToastPrimitives.Title className="text-sm font-semibold">{title}</ToastPrimitives.Title>}
        {description && (
          <ToastPrimitives.Description className="text-sm opacity-90">
            {description}
          </ToastPrimitives.Description>
        )}
      </div>
      {action}
      <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600">
        <X className="h-4 w-4" />
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  )
}

export function Toaster() {
  const { toasts, removeToast } = useContext(ToastContext)

  return (
    <ToastPrimitives.Provider>
      <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:right-0 sm:flex-col md:max-w-[420px]">
        <ToastPrimitives.Viewport className="mt-0 flex flex-col-reverse p-[var(--viewport-padding)] sm:flex-col" />
      </div>
      {toasts.map(({ id, title, description, action, variant }) => (
        <Toast
          key={id}
          variant={variant}
          title={title}
          description={description}
          action={action}
          onOpenChange={(open) => {
            if (!open) removeToast(id)
          }}
        />
      ))}
    </ToastPrimitives.Provider>
  )
}