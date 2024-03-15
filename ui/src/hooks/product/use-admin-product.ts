import { useMedusa } from "medusa-react";
import qs from "qs";
import {useQuery} from "@tanstack/react-query";

export const useAdminProduct = (
  /**
   * Filters and pagination configurations to apply on the retrieved customer groups.
   */
  query: {id: string|undefined},
  options: object = {},
) => {
  const { client } = useMedusa()
  let path = ''
  path = `/admin/custom/product`
  if (query) {
    const queryString = qs.stringify(query)
    path = path + `?${queryString}`
  }
  const { data, ...rest } = useQuery(
    ["useAdminProduct", query],
    () => client.admin.customers.client.request("GET", path, undefined, {}, {}),
    options
  )
  return { ...data, ...rest } as const
}
