import {
  AdminCustomersListRes,
  AdminCustomersRes,
  AdminGetCustomersParams,
} from "@medusajs/medusa"
import { Response,Client } from "@medusajs/medusa-js"
import { useQuery } from "@tanstack/react-query"
import { useMedusa } from "medusa-react"

import medusaRequest from "../../services/request"
import qs from "qs"
// import { UseQueryOptionsWrapper } from "medusa-react/dist/utils"
// import { queryKeysFactory } from "medusa-react/dist/utils"

export const useAdminCustomersTemp = (
  query?: AdminGetCustomersParams,
  customHeaders: Record<string, any> = {}
) => {
  const { client } = useMedusa()
  let path = `/admin/custom/customers`
  if (query) {
    const queryString = qs.stringify(query)
    path = `/admin/custom/customers?${queryString}`
  }
  const { data, ...rest } = useQuery(
    ["custom-admin-customers", query],
    () => client.admin.customers.client.request("GET", path, undefined, {}, customHeaders),
    {
      staleTime: 3000, // 设置staleTime为3秒
    }
  )
  return { ...data, ...rest } as const
}

