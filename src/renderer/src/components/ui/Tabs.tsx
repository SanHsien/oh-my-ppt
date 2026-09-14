import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@renderer/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#d8ccb5]/75 bg-[#fff9ef]/76 p-1 shadow-[inset_0_1px_2px_rgba(77,63,46,0.08)] dark:border-[#35482e] dark:bg-[#141913] dark:shadow-none',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors dark:text-[#a2b89d] dark:hover:text-[#ffffff]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fbc8f]',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-[#dbe7ca] data-[state=active]:text-[#2f3b28] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#364e2d] dark:data-[state=active]:text-[#ffffff] dark:data-[state=active]:border dark:data-[state=active]:border-[#547348] dark:data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fbc8f]',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName
