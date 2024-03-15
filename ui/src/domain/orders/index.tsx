import React, { useMemo, useState } from "react"
import { Route, Routes, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAdminCreateBatchJob } from "medusa-react"
import Spacer from "../../components/atoms/spacer"
import RouteContainer from "../../components/extensions/route-container"
import WidgetContainer from "../../components/extensions/widget-container"
import Button from "../../components/fundamentals/button"
import ExportIcon from "../../components/fundamentals/icons/export-icon"
import BodyCard from "../../components/organisms/body-card"
import TableViewHeader from "../../components/organisms/custom-table-header"
import ExportModal from "../../components/organisms/export-modal"
// import OrderTable from "../../components/templates/order-table"
import OrderTable from "../../components/templates/order-table-custom"
import useNotification from "../../hooks/use-notification"
import useToggleState from "../../hooks/use-toggle-state"
import { usePolling } from "../../providers/polling-provider"
import { useRoutes } from "../../providers/route-provider"
import { useWidgets } from "../../providers/widget-provider"
import { getErrorMessage } from "../../utils/error-messages"
import Details from "./details"
import { transformFiltersAsExportContext } from "./utils"
import PlusIcon from "../../components/fundamentals/icons/plus-icon";

const VIEWS = ["orders", "drafts"]

const OrderIndex = () => {
  const view = "orders"

  const { t } = useTranslation()
  const { resetInterval } = usePolling()
  const navigate = useNavigate()
  const createBatchJob = useAdminCreateBatchJob()
  const notification = useNotification()

  const [contextFilters, setContextFilters] =
    useState<Record<string, { filter: string[] }>>()

  const {
    open: openExportModal,
    close: closeExportModal,
    state: exportModalOpen,
  } = useToggleState(false)

  const {
    open: openCreateModal,
    close: closeCreateModal,
    state: createModalOpen
  } = useToggleState(false)

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const syncOrders = () => {
    createBatchJob.mutate(
      {
        type: "synchronize-orders",
        context: {
          ids: selectedRowKeys,
        },
        dry_run: false,
      },
      {
        onSuccess: () => {
          notification(
            t("orders-success", "Success"),
            t("orders-successfully-initiated-sync", "Successfully initiated sync"),
            "success"
          )
        },
        onError: (err) => {
          notification(t("orders-error", "Error"), getErrorMessage(err), "error")
        },
      }
    )
  }

  const { getWidgets } = useWidgets()

  const actions = useMemo(() => {
    return (
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="small"
          onClick={() => syncOrders()}
        >
          <PlusIcon size={20} />
          { t("批量同步订单", "批量同步订单") }
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => openCreateModal()}
        >
          <PlusIcon size={20} />
          { t("添加订单", "添加订单") }
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => openExportModal()}
        >
          <ExportIcon size={20} />
          {t("orders-export-orders", "Export Orders")}
        </Button>
      </div>
    )
  }, [view])

  const handleCreateExport = () => {
    const reqObj = {
      dry_run: false,
      type: "order-export",
      context: contextFilters
        ? transformFiltersAsExportContext(contextFilters)
        : {},
    }

    createBatchJob.mutate(reqObj, {
      onSuccess: () => {
        resetInterval()
        notification(
          t("orders-success", "Success"),
          t(
            "orders-successfully-initiated-export",
            "Successfully initiated export"
          ),
          "success"
        )
      },
      onError: (err) => {
        notification(t("orders-error", "Error"), getErrorMessage(err), "error")
      },
    })

    closeExportModal()
  }

  return (
    <>
      <div className="gap-y-xsmall flex h-full grow flex-col">
        {getWidgets("order.list.before").map((w, i) => {
          return (
            <WidgetContainer
              key={i}
              injectionZone={"order.list.before"}
              widget={w}
              entity={undefined}
            />
          )
        })}
        <div className="flex w-full grow flex-col">
          <BodyCard
            customHeader={
              <TableViewHeader
                views={VIEWS}
                setActiveView={(v) => {
                  if (v === "drafts") {
                    navigate(`/a/draft-orders`)
                  }
                }}
                activeView={view}
              />
            }
            className="h-fit"
            customActionable={actions}
          >
            <OrderTable selectedRowKeys={selectedRowKeys} setSelectedRowKeys={setSelectedRowKeys} setContextFilters={setContextFilters} />
          </BodyCard>
        </div>
        {getWidgets("order.list.after").map((w, i) => {
          return (
            <WidgetContainer
              key={i}
              injectionZone={"order.list.after"}
              widget={w}
              entity={undefined}
            />
          )
        })}
        <Spacer />
      </div>
      {exportModalOpen && (
        <ExportModal
          title={t("orders-export-orders", "Export Orders")}
          handleClose={() => closeExportModal()}
          onSubmit={handleCreateExport}
          loading={createBatchJob.isLoading}
        />
      )}
      {createModalOpen && (
        <ExportModal
          title={t("orders-export-orders", "Export Orders")}
          handleClose={() => closeExportModal()}
          onSubmit={handleCreateExport}
          loading={createBatchJob.isLoading}
        />
      )}
    </>
  )
}

const Orders = () => {
  const { getNestedRoutes } = useRoutes()

  const nestedRoutes = getNestedRoutes("/products")

  return (
    <Routes>
      <Route index element={<OrderIndex />} />
      <Route path="/:id" element={<Details />} />
      {nestedRoutes.map((r, i) => {
        return (
          <Route
            path={r.path}
            key={i}
            element={<RouteContainer route={r} previousPath={"/orders"} />}
          />
        )
      })}
    </Routes>
  )
}

export default Orders
