import { Route, Routes } from "react-router-dom"
import RouteContainer from "../../components/extensions/route-container"
import { useRoutes } from "../../providers/route-provider"
import Edit from "./edit"
import WhmcsImport from "./whmcs_import"
import Overview from "./overview"
import WhmcsImportHistory from "./whmcs_import/history"
import WhmcsImportHistoryDetail from "./whmcs_import/history-detail"

const ProductsRoute = () => {
  const { getNestedRoutes } = useRoutes()

  const nestedRoutes = getNestedRoutes("/products")

  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="/:id" element={<Edit />} />
      <Route path="/whmcs_import" element={<WhmcsImport />} />
      <Route path="/whmcs_import_history" element={<WhmcsImportHistory />} />
      <Route path="/whmcs_import_history/:id" element={<WhmcsImportHistoryDetail />} />
      {nestedRoutes.map((r, i) => {
        return (
          <Route
            path={r.path}
            key={i}
            element={<RouteContainer route={r} previousPath={"/products"} />}
          />
        )
      })}
    </Routes>
  )
}

export default ProductsRoute
