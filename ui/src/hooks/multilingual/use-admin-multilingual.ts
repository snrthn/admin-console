import { useMedusa } from "medusa-react";
import qs from "qs";
import {useQuery} from "@tanstack/react-query";

export const useAdminMultilingual = (
  query: {
    relid: string,
    type: string
  },
  options: object = {},
) => {
  const { client } = useMedusa()
  let path = ''
  path = `/admin/multilingual`
  if (query) {
    const queryString = qs.stringify(query)
    path = path + `?${queryString}`
  }
  const { data, ...rest } = useQuery(
    ["useAdminMultilingual", query],
    () => client.admin.customers.client.request("GET", path, undefined, {}, {}),
    options
  )
  return { ...data, ...rest } as const
}
