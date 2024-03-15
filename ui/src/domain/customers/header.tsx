import { useNavigate } from "react-router-dom"
import TableViewHeader from "../../components/organisms/custom-table-header"
import { t } from "i18next";

type P = {
  activeView: "customers" | "groups"
}

/*
 * Shared header component for "customers" and "customer groups" page
 */
function CustomersPageTableHeader(props: P) {
  const navigate = useNavigate()
  return (
    <TableViewHeader
      setActiveView={(v) => {
        if (v === t('customers-tabs-customers')) {
          navigate(`/a/customers`)
        } else {
          navigate(`/a/customers/groups`)
        }
      }}
      views={[t('customers-tabs-customers'), t('customers-tabs-groups')]}
      activeView={props.activeView}
    />
  )
}

export default CustomersPageTableHeader
