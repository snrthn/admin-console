import { useQuery } from "@tanstack/react-query"
import { useMedusa } from "medusa-react"

import qs from "qs"
import medusaRequest from "../../services/request";

export const useAdminCustomerDetails = (
    id: string,
    customHeaders: Record<string, any> = {}
) => {
    const { client } = useMedusa()
    let path = `/admin/customers/` + id + "?expand=customer_fingerprint,orders,tags,groups"

    const { data, ...rest } = useQuery(
        ["custom-admin-customers", id],
        () => client.admin.customers.client.request("GET", path, undefined, {}, customHeaders),
        {
            staleTime: 3000, // 设置staleTime为3秒
        }
    )
    return { ...data, ...rest } as const
}

export const useAdminCustomer = (
    id: string,
    customHeaders: Record<string, any> = {}
) => {
    const { client } = useMedusa()
    let path = `/admin/customers/` + id + "?expand=customer_fingerprint,orders,groups"

    const { data, ...rest } = useQuery(
        ["custom-admin-customers", id],
        () => client.admin.customers.client.request("GET", path, undefined, {}, customHeaders),
        {
            staleTime: 3000, // 设置staleTime为3秒
        }
    )
    return { ...data, ...rest } as const
}


export type queryCustomerTageType = {
    action: string,
}

export const useCustomerTagGroup = (
    query?:queryCustomerTageType,
    customHeaders: Record<string, any> = {}
) => {
    const { client } = useMedusa()
    let path = `/admin/custom/customer-info`
    if (query) {
        const queryString = qs.stringify(query)
        path = `/admin/custom/customer-info?${queryString}`
    }
    const { data, ...rest } = useQuery(
        ["useCustomerInfo", query],
        () => client.admin.customers.client.request("GET", path, undefined, {}, customHeaders),
        {
            staleTime: 0, // 设置staleTime为3秒
        }
    )
    return { ...data, ...rest } as const
}

export const useAdminCustomerUpdateTagGroup = async (
    query: {
        action: string,
        customer_id: string,
        groups: string[],
        tags: string[],
    },
    customHeaders: Record<string, any> = {}
) => {
    let path = `/admin/custom/customer-info`
    if (query) {
        const queryString = qs.stringify(query)
        path = `/admin/custom/customer-info?${queryString}`
    }
    console.log(query)
    const {data} = await medusaRequest("POST", path, query)

    return { ...data } as const
}

