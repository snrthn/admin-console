import { z } from "zod"
import { priceListPricesSchema } from "./schema"

export type PricePayload = {
  id?: string
  amount: number
  currency_code?: string
  region_id?: string
  variant_id: string
  metadata?: Record<string, any>
}

export type PriceListPricesSchema = z.infer<typeof priceListPricesSchema>
