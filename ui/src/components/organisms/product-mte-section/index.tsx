import OptionsProvider, { useOptionsContext } from "../product-variants-section/options-provider"
import { Product } from "@medusajs/medusa"
import { useTranslation } from "react-i18next"

import { ActionType } from "../../molecules/actionables"
import Section from "../../organisms/section"
import useToggleState from "../../../hooks/use-toggle-state"
import EditMteModal from "./edit-mte-modal";
import EditIcon from "../../fundamentals/icons/edit-icon";

type Props = {
  product: Product
}

const ProductVariantsSection = ({ product }: Props) => {
  const { t } = useTranslation()
  const {
    state: showEditMte,
    close: hideEditMte,
    toggle: toggleEditMte,
  } = useToggleState()

  const actions: ActionType[] = [
    {
      label: t("修改图文详情", "修改图文详情"),
      onClick: toggleEditMte,
      icon: <EditIcon size="20" />,
    }
  ]
  return (
    <OptionsProvider product={product}>
      <Section title={t("图文详情", "图文详情")} actions={actions}>
        <div className="mt-xlarge">
          {product.detail_id}
        </div>
      </Section>
      {showEditMte && (
        <EditMteModal
          product={product}
          close={hideEditMte
        }
        />
      )}
    </OptionsProvider>
  )
}

const ProductOptions = () => {
  const { options, status } = useOptionsContext()

  if (status === "error") {
    return null
  }

  if (status === "loading" || !options) {
    return (
      <div className="mt-base grid grid-cols-3 gap-x-8">
        {Array.from(Array(2)).map((_, i) => {
          return (
            <div key={i}>
              <div className="mb-xsmall bg-grey-30 h-6 w-9 animate-pulse"></div>
              <ul className="flex flex-wrap items-center gap-1">
                {Array.from(Array(3)).map((_, j) => (
                  <li key={j}>
                    <div className="rounded-rounded bg-grey-10 text-grey-50 h-8 w-12 animate-pulse">
                      {j}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mt-base flex flex-wrap items-center gap-8">
      {options.map((option) => {
        return (
          <div key={option.id}>
            <h3 className="inter-base-semibold mb-xsmall">{option.title}</h3>
            <ul className="flex flex-wrap items-center gap-1">
              {option.values
                ?.map((val) => val.value)
                .filter((v, index, self) => self.indexOf(v) === index)
                .map((v, i) => (
                  <li key={i}>
                    <div className="inter-small-semibold rounded-rounded bg-grey-10 text-grey-50 whitespace-nowrap px-3 py-[6px]">
                      {v}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default ProductVariantsSection
