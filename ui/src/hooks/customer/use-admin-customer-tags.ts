import {adminCustomerGroupKeys, useMedusa} from "medusa-react";
import qs from "qs";
import {useQuery} from "@tanstack/react-query";
import {array} from "zod";
import { AdminGetCustomerGroupsParams } from "@medusajs/medusa";

export const useCustomerTagGroup = (
  /**
   * Filters and pagination configurations to apply on the retrieved customer groups.
   */
  query?: AdminGetCustomerGroupsParams,
  options: object = {},
  type: string = "Group"
) => {
  const { client } = useMedusa()
  let path = ''
  if (type === "Group") {
    path = `/admin/customer-groups`
  } else {
    path = `/admin/customer-tags`
  }
  if (query) {
    const queryString = qs.stringify(query)
    path = path + `?${queryString}`
  }
  const { data, ...rest } = useQuery(
    ["useCustomerTagInfo" + type, query],
    () => client.admin.customers.client.request("GET", path, undefined, {}, {}),
    options
  )
  return { ...data, ...rest } as const
}
