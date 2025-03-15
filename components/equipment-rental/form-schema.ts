import * as z from "zod"

// Form validation schema
export const formSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  company: z.string().optional(),

  // Rental Details
  category: z.string().optional(),
  rentalStart: z.date({
    required_error: "Start date is required.",
  }),
  rentalEnd: z.date({
    required_error: "End date is required.",
  }),

  // Delivery Options
  deliveryOption: z.enum(["pickup", "delivery"], {
    required_error: "Please select a delivery option.",
  }),
  deliveryAddress: z
    .string()
    .optional()
    .refine((val) => !val || val.length > 0, { message: "Delivery address is required when delivery is selected" }),

  // Additional Options
  insuranceOption: z.boolean().default(false),
  operatorNeeded: z.boolean().default(false),

  // Payment Information
  paymentMethod: z.enum(["credit", "debit", "invoice"], {
    required_error: "Please select a payment method.",
  }),
  paymentStatus: z
    .enum(["pending", "paid", "partial"], {
      required_error: "Please select a payment status.",
    })
    .default("pending"),
  invoiceNumber: z.string().optional(),
  paymentNotes: z.string().optional(),

  // Additional Information
  specialRequirements: z.string().optional(),
  internalNotes: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
})

export type FormValues = z.infer<typeof formSchema>
