import { useQuery } from "@tanstack/react-query"
import { useMedusa } from "medusa-react"

import qs from "qs"
import medusaRequest from "../../services/request"
import { GetProp, TableProps } from "antd"

export type queryCustomerTageType = {
  action: string,
}

export type queryCustomerInfoType = {
  offset: number,
  limit: number,
  search?: string,
  q?: string,
}

type bodyCustomerStatusType = {
  id : string,
  status:string
}

type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;

export interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Parameters<GetProp<TableProps, 'onChange'>>[1];
  search?: string;
}

export const useCustomerInfo = (
  query?:queryCustomerTageType,
  customHeaders: Record<string, any> = {}
) => {
  const { client } = useMedusa()
  let path = `/admin/custom/customer-info`
  if (query) {
    const queryString = qs.stringify(query)
    // path = `/admin/custom/customer-info?${queryString}`
    path += `?${queryString}`
  }
  const { data, ...rest } = useQuery(
    ["useCustomerInfo", query],
    () => client.admin.customers.client.request("GET", path, undefined, {}, customHeaders),
    {
      staleTime: 3000, // 设置staleTime为3秒
    }
  )
  console.log(data,rest)
  return { ...data, ...rest } as const
}

export const createNewTag = async (
  body?:{
    value: string
  },
  customHeaders: Record<string, any> = {}
) =>{
  // const { client } = useMedusa()
  let path = `/admin/custom/customer-info`
  let payload = {
    action : "createtag",
    ...body
  }
  const {data} = await medusaRequest("POST", path, payload)
  return { ...data }
}

export const customersList = async (
  query?:queryCustomerInfoType,
  customHeaders: Record<string, any> = {}
) => {
  // let path = `/admin/custom/customers`
  let path = `/admin/customers`
  if (query) {
    const queryString = qs.stringify(query)
    path += `?${queryString}`
  }
  console.log("Path",path,query)
  const {data} = await medusaRequest("GET", path, {})
  return { ...data }
}

/**
 * 调整客户状态
 * @param body 
 * @param customHeaders 
 * @returns 
 */
export const changeStatus = async (
  body?:bodyCustomerStatusType,
  customHeaders: Record<string, any> = {}
) =>{
  // const { client } = useMedusa()
  let path = `/admin/custom/customer-info`
  let payload = {
    action : "changestatus",
    ...body
  }
  const {data} = await medusaRequest("POST", path, payload)
  //console.log(data)
  // const { data } = useQuery(
  //   ["useChangeStatus", body],
  //   () => client.admin.customers.client.request("POST", path, payload, {}, customHeaders),
  //   {
  //     staleTime: 3000, // 设置staleTime为3秒
  //   }
  // )
  return { ...data }
}

/**
 * 添加标签
 * @param body 
 * @param customHeaders 
 * @returns 
 */
export const addTag = async (
  body?:{
    tagid: string,
    customerid: string  
  },
  customHeaders: Record<string, any> = {}
) =>{
  // const { client } = useMedusa()
  let path = `/admin/custom/customer-info`
  let payload = {
    action : "addtag",
    ...body
  }
  const {data} = await medusaRequest("POST", path, payload)
  return { ...data }
}

/**
 * 添加分组
 * @param body 
 * @param customHeaders 
 * @returns 
 */
export const addGroup = async (
  body?:{
    groupid: string,
    customerid: string  
  },
  customHeaders: Record<string, any> = {}
) =>{
  // const { client } = useMedusa()
  let path = `/admin/custom/customer-info`
  let payload = {
    action : "addgroup",
    ...body
  }
  const {data} = await medusaRequest("POST", path, payload)
  return { ...data }
}