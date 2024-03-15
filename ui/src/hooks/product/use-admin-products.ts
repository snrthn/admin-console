import {adminCustomerGroupKeys, useMedusa} from "medusa-react";
import qs from "qs";
import {useQuery} from "@tanstack/react-query";
import {AdminGetProductsParams} from "@medusajs/medusa/dist/api/routes/admin/products/list-products";

export const useAdminProducts = (
  /**
   * Filters and pagination configurations to apply on the retrieved customer groups.
   */
  query?: AdminGetProductsParams,
  options: object = {},
) => {
  const { client } = useMedusa()
  let path = ''
  path = `/admin/products`
  if (query) {
    const queryString = qs.stringify(query)
    path = path + `?${queryString}`
  }
  const { data, ...rest } = useQuery(
    ["useAdminProducts", query],
    () => client.admin.customers.client.request("GET", path, undefined, {}, {}),
    options
  )
  return { ...data, ...rest } as const
}
