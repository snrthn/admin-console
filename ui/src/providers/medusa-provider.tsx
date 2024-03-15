import { MedusaProvider as Provider } from "medusa-react"
import { PropsWithChildren } from "react"
import { PETAN_EC_BACKEND_URL } from "../constants/medusa-backend-url"
import { queryClient } from "../constants/query-client"

export const MedusaProvider = ({ children }: PropsWithChildren) => {
  return (
    <Provider
      queryClientProviderProps={{
        client: queryClient,
      }}
      baseUrl={PETAN_EC_BACKEND_URL}
    >
      {children}
    </Provider>
  )
}
