import clsx from "clsx"
import { isEmpty } from "lodash"
import { useAdminOrders } from "medusa-react"
import qs from "qs"
import React, { useEffect, useState } from "react"
import {useLocation, useNavigate} from "react-router-dom"
import { usePagination, useTable } from "react-table"
import { useAnalytics } from "../../../providers/analytics-provider"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"
import Table from "../../molecules/table"
import TableContainer from "../../organisms/table-container"
import OrderFilters from "../order-filter-dropdown"
import useOrderTableColums from "../order-table/use-order-column"
import { useOrderFilters } from "../order-table/use-order-filters"
import { Space, Table as TableAntd, Tag } from 'antd';
import type { TableProps } from 'antd';
import {useTranslation} from "react-i18next";

const DEFAULT_PAGE_SIZE = 15

const defaultQueryProps = {
  expand: "customer,shipping_address",
  fields:
    "id,status,display_id,created_at,email,fulfillment_status,payment_status,total,currency_code,whmcs_order_id,whmcs_invoice_id,refundable_total,refundable_items,notes",
}

type OrderTableProps = {
  setContextFilters: (filters: Record<string, { filter: string[] }>) => void
  setSelectedRowKeys: (selectedRowKeys: React.Key[]) => void
  selectedRowKeys: React.Key[]
}

const OrderTable = ({ setContextFilters, setSelectedRowKeys, selectedRowKeys }: OrderTableProps) => {
  const { t } = useTranslation()
  const location = useLocation()

  const { isFeatureEnabled } = useFeatureFlag()
  const { trackNumberOfOrders } = useAnalytics()

  let hiddenColumns = ["sales_channel"]
  if (isFeatureEnabled("sales_channels")) {
    if (!defaultQueryProps.expand.includes("sales_channel")) {
      defaultQueryProps.expand = defaultQueryProps.expand + ",sales_channel"
    }
    hiddenColumns = []
  }

  const {
    removeTab,
    setTab,
    saveTab,
    availableTabs: filterTabs,
    activeFilterTab,
    reset,
    paginate,
    setFilters,
    filters,
    setQuery: setFreeText,
    queryObject,
    representationObject,
  } = useOrderFilters(location.search, defaultQueryProps)
  const filtersOnLoad = queryObject

  const offs = parseInt(filtersOnLoad?.offset) || 0
  const lim = parseInt(filtersOnLoad.limit) || DEFAULT_PAGE_SIZE

  const [query, setQuery] = useState(filtersOnLoad?.query)
  const [numPages, setNumPages] = useState(0)

  const { orders, isLoading, count } = useAdminOrders(queryObject, {
    keepPreviousData: true,
    onSuccess: ({ count }) => {
      trackNumberOfOrders({
        count,
      })
    },
  })

  useEffect(() => {
    const controlledPageCount = Math.ceil(count! / queryObject.limit)
    setNumPages(controlledPageCount)
  }, [orders])

  useEffect(() => {
    setContextFilters(filters as {})
  }, [filters])

  const [columns] = useOrderTableColums()

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    // Get the state from the instance
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data: orders || [],
      manualPagination: true,
      initialState: {
        pageSize: lim,
        pageIndex: offs / lim,
        hiddenColumns,
      },
      pageCount: numPages,
      autoResetPage: false,
    },
    usePagination
  )

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        setFreeText(query)
        gotoPage(0)
      } else {
        // if we delete query string, we reset the table view
        reset()
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleNext = () => {
    if (canNextPage) {
      paginate(1)
      nextPage()
    }
  }

  const handlePrev = () => {
    if (canPreviousPage) {
      paginate(-1)
      previousPage()
    }
  }

  const updateUrlFromFilter = (obj = {}) => {
    const stringified = qs.stringify(obj)
    window.history.replaceState(`/a/orders`, "", `${`?${stringified}`}`)
  }

  const refreshWithFilters = () => {
    const filterObj = representationObject

    if (isEmpty(filterObj)) {
      updateUrlFromFilter({ offset: 0, limit: DEFAULT_PAGE_SIZE })
    } else {
      updateUrlFromFilter(filterObj)
    }
  }

  const clearFilters = () => {
    reset()
    setQuery("")
  }

  useEffect(() => {
    refreshWithFilters()
  }, [representationObject])

  interface DataType {
    id: React.Key;
    created_at: string,
    currency_code: string,
    customer: {
      first_name: string,
      last_name: string
      id: string
    },
    display_id: number,
    email: string,
    fulfillment_status: string,
    notes: string,
    payment_status: string,
    refundable_items: string,
    refundable_total: string,
    sales_channel: object,
    shipping_address: object,
    status: string,
    total: number,
    whmcs_invoice_id: string,
    whmcs_order_id: string
  }

  const formatISOStringToDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const navigate = useNavigate()

  const columnsA: TableProps<DataType>['columns'] = [
    {
      title: t('订单ID', '订单ID'),
      dataIndex: 'display_id',
      key: 'display_id',
      render: (text) => <a>{text}</a>,
    },
    {
      title: t('客户名称', '客户名称'),
      dataIndex: 'email',
      key: 'email',
      render: (text, record, index) => {
        return (<a target="_blank" href={record.customer.id}>{(record.customer.first_name || "") + " " + (record.customer.last_name || "")}</a>)
      },
    },
    {
      title: t('状态', '状态'),
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        let color = 'green';
        if (text === 'pending') color = 'red';
        if (text === 'requires_action') color = 'blue';
        if (text === 'canceled' || text === "archived") color = 'black';
        return (<Tag color={color}>{text}</Tag>)
      },
    },
    {
      title: t('支付状态', '支付状态'),
      dataIndex: 'payment_status',
      key: 'payment_status',
    },
    {
      title: t('总计', '总计'),
      dataIndex: 'total',
      key: 'total',
      render: (text, record) => (text / 100).toFixed(2) + " " + record.currency_code.toUpperCase()
    },
    {
      title: t('创建时间', '创建时间'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatISOStringToDate(text)
    },
    {
      title: t('WHMCS订单号', 'WHMCS订单号'),
      dataIndex: 'whmcs_order_id',
      key: 'whmcs_order_id',
      render : (text) => <a target="_blank" href={`https://www.51hosting.com/admin/orders.php?action=view&id=${text}`}>{text}</a>
    },
    {
      title: t('WHMCS账单号', 'WHMCS账单号'),
      dataIndex: 'whmcs_invoice_id',
      key: 'whmcs_invoice_id',
      render : (text) => <a target="_blank" href={`https://www.51hosting.com/admin/invoices.php?action=edit&id=${text}`}>{text}</a>
    },
    {
      title: t('Action', 'Action'),
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick = {() => navigate(record.id)}>{t("修改", "修改")}</a>
          <a onClick = {() => navigate(record.id)}>{t("详情", "详情")}</a>
        </Space>
      ),
    },
  ];

  const data: DataType[] = orders

  return (
    <div>
      <OrderFilters
        filters={filters}
        submitFilters={setFilters}
        clearFilters={clearFilters}
        tabs={filterTabs}
        onTabClick={setTab}
        activeTab={activeFilterTab}
        onRemoveTab={removeTab}
        onSaveTab={saveTab}
      />
      <TableAntd
        rowKey = {(record) => record.id}
        rowSelection={rowSelection}
        loading={isLoading}
        columns={columnsA}
        dataSource={data}
      />

      <TableContainer
        isLoading={isLoading}
        hasPagination
        numberOfRows={lim}
        pagingState={{
          count: count!,
          offset: queryObject.offset,
          pageSize: queryObject.offset + rows.length,
          title: "Orders",
          currentPage: pageIndex + 1,
          pageCount: pageCount,
          nextPage: handleNext,
          prevPage: handlePrev,
          hasNext: canNextPage,
          hasPrev: canPreviousPage,
        }}
      >
        <Table
          filteringOptions={
            <OrderFilters
              filters={filters}
              submitFilters={setFilters}
              clearFilters={clearFilters}
              tabs={filterTabs}
              onTabClick={setTab}
              activeTab={activeFilterTab}
              onRemoveTab={removeTab}
              onSaveTab={saveTab}
            />
          }
          enableSearch
          handleSearch={setQuery}
          searchValue={query}
          {...getTableProps()}
          className={clsx({ ["relative"]: isLoading })}
        >
          <Table.Head>
            {headerGroups?.map((headerGroup) => (
              <Table.HeadRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((col) => (
                  <Table.HeadCell {...col.getHeaderProps()}>
                    {col.render("Header")}
                  </Table.HeadCell>
                ))}
              </Table.HeadRow>
            ))}
          </Table.Head>
          <Table.Body {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row)
              return (
                <Table.Row
                  color={"inherit"}
                  linkTo={row.original.id}
                  {...row.getRowProps()}
                  className="group"
                >
                  {row.cells.map((cell) => {
                    return (
                      <Table.Cell {...cell.getCellProps()}>
                        {cell.render("Cell")}
                      </Table.Cell>
                    )
                  })}
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </TableContainer>
    </div>
  )
}

export default React.memo(OrderTable)
