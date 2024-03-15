import { zodResolver } from "@hookform/resolvers/zod"
import { ExclamationCircle, Spinner } from "@medusajs/icons"
import type { PriceList, Product } from "@medusajs/medusa"
import {
  Button,
  FocusModal,
  ProgressStatus,
  ProgressTabs,
  Text,
  usePrompt,
} from "@medusajs/ui"
import { useAdminCreatePriceListPrices } from "medusa-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as z from "zod"

import { Form } from "../../../../components/helpers/form"
import useNotification from "../../../../hooks/use-notification"
import { useFeatureFlag } from "../../../../providers/feature-flag-provider"
import { getErrorMessage } from "../../../../utils/error-messages"
import { nestedForm } from "../../../../utils/nested-form"
import {
  PriceListPricesForm,
  PricePayload,
  getDbSafeAmount,
  priceListPricesSchema,
  usePricesFormData,
} from "../../forms/price-list-prices-form"
import {
  PriceListProductPricesForm,
  priceListProductPricesSchema,
  type PriceListProductPricesSchema,
} from "../../forms/price-list-product-prices-form"
import {
  PriceListProductsForm,
  priceListProductsSchema,
} from "../../forms/price-list-products-form"
import PriceListConfigOptionForm, { ConfigOption,NewPriceList,Option } from "../../forms/price-list-configoption-form/configoption"
import ConfigOptionSubPrice from "../../forms/price-list-configoption-form/configoption-sub-price"
import medusaRequest from "../../../../services/request"
import ProductTypeRadio from "../../forms/price-list-configoption-form/product-type-radio"



type AddProductsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  priceList: NewPriceList
  /**
   * Products that are already in the price list
   */
  productIds: string[]
}

enum Tab {
  PRODUCTS = "products",
  PRICES = "prices",
  EDIT = "edit",
  CONFIGOPTION = "Config Options",
  CONFIGOPTIONSUB = "configoption prices ",
}

const addProductsSchema = z.object({
  products: priceListProductsSchema,
  prices: priceListPricesSchema,
})

type AddProductsFormValue = z.infer<typeof addProductsSchema>

type StepStatus = {
  [key in Tab]: ProgressStatus
}

const AddProductsModal = ({
  open,
  onOpenChange,
  priceList,
  productIds,
}: AddProductsModalProps) => {
  const [product, setProduct] = React.useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [configoption, setConfigOption] = React.useState<ConfigOption | null>(null)
  const [modifiedPrice,setModifiedPrice] = React.useState<Option[]| null>(); //修改的配置子项
  const [premodifiedPrice,setPremodifiedPrice] = React.useState<Option[]|null>(); //预修改的配置子项
  const [productType,setProductType] = React.useState("product"); //产品类型

  const [tab, setTab] = React.useState<Tab>(Tab.PRODUCTS)
  const [status, setStatus] = React.useState<StepStatus>({
    [Tab.PRODUCTS]: "not-started",
    [Tab.PRICES]: "not-started",
    [Tab.EDIT]: "not-started",
    [Tab.CONFIGOPTION]: "not-started",
    [Tab.CONFIGOPTIONSUB]: "not-started",
  })

  const { t } = useTranslation()

  const promptTitle = t("price-list-new-form-prompt-title", "Are you sure?")
  const promptExitDescription = t(
    "price-list-new-form-prompt-exit-description",
    "You have unsaved changes, are you sure you want to exit?"
  )
  const promptBackDescription = t(
    "price-list-new-form-prompt-back-description",
    "You have unsaved changes, are you sure you want to go back?"
  )

  const prompt = usePrompt()
  const notification = useNotification()

  const { isFeatureEnabled } = useFeatureFlag()
  const isTaxInclPricesEnabled = isFeatureEnabled("tax_inclusive_pricing")

  const form = useForm<AddProductsFormValue>({
    resolver: zodResolver(addProductsSchema),
    defaultValues: {
      products: { ids: [] },
      prices: { products: {} },
    },
  })

  const {
    trigger,
    handleSubmit,
    setValue,
    setError,
    getValues,
    reset,
    formState: { isDirty },
  } = form

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    getValues: getEditValues,

    formState: { isDirty: isEditDirty },
  } = useForm<PriceListProductPricesSchema>({
    resolver: zodResolver(priceListProductPricesSchema),
  })

  const { mutateAsync, isLoading: isSubmitting } =
    useAdminCreatePriceListPrices(priceList.id)

  const { isError, isLoading, isNotFound, regions, currencies } =
    usePricesFormData({
      productIds: selectedIds,
    })

  const onCloseModal = React.useCallback(() => {
    onOpenChange(false)
    setTab(Tab.PRODUCTS)
    setSelectedIds([])
    setStatus({
      [Tab.PRODUCTS]: "not-started",
      [Tab.PRICES]: "not-started",
      [Tab.EDIT]: "not-started",
      [Tab.CONFIGOPTION]: "not-started",
      [Tab.CONFIGOPTIONSUB]: "not-started",
    })

    resetEdit()
    reset({
      products: { ids: [] },
      prices: { products: {} },
    })
  }, [onOpenChange, reset, resetEdit])

  const onModalStateChange = React.useCallback(
    async (open: boolean) => {
      if (!open && (isDirty || isEditDirty)) {
        const response = await prompt({
          title: promptTitle,
          description: promptExitDescription,
        })

        if (!response) {
          onOpenChange(true)
          return
        }

        onCloseModal()
      }

      onOpenChange(open)
    },
    [
      isDirty,
      isEditDirty,
      promptTitle,
      promptExitDescription,
      prompt,
      onCloseModal,
      onOpenChange,
    ]
  )

  React.useEffect(() => {
    //初始化modifiedPrice
    const metadata = priceList.metadata;
    if (metadata) {
      setModifiedPrice(metadata.configoption_price || [])
    }
    const productType = priceList.product_type;
    if (productType) {
      setProductType(productType)
    }
  },[])

  const onSavePriceEdit = handleEditSubmit((data) => {
    if (!product) {
      return
    }

    setValue(`prices.products.${product.id}`, data, {
      shouldDirty: true,
      shouldTouch: true,
    })

    setProduct(null)
    resetEdit(undefined, {
      keepDirty: false,
      keepTouched: false,
    })
    setStatus((prev) => ({
      ...prev,
      [Tab.PRICES]: "in-progress",
    }))
    setTab(Tab.PRICES)
  })
  const onSaveConfigOptionPriceEdit = handleEditSubmit((data) => {
    if (!product) {
      return
    }

    //将修改后的价格保存到modifiedPrice中
    //遍历出options中的每一项，然后更新到modifiedPrice中
    let newModifiedPrice = modifiedPrice || []
    // premodifiedPrice?.forEach((option) => {
    //   newModifiedPrice[option.id] = option;
    // })
    premodifiedPrice?.forEach((item) => {
        const idx = newModifiedPrice.findIndex(dataItem => dataItem.id === item.id)
        if (idx !== -1) {
          newModifiedPrice[idx] = item;
        }else{
          newModifiedPrice.push(item)
        }
    })

    setModifiedPrice(newModifiedPrice)
    console.log("Modified options new",newModifiedPrice)

    setConfigOption(null)
    setTab(Tab.CONFIGOPTION)
  })

  const onSubmit = handleSubmit(async (data) => {
    const prices: PricePayload[] = []

    const productPriceKeys = Object.keys(data.prices.products)
    const productIds = data.products.ids

    if (!productPriceKeys.length || !data.prices.products) {
      setError("prices.products", {
        type: "manual",
        message: t(
          "price-list-add-products-modal-no-prices-error",
          "Please assign prices for at least one product."
        ) as string,
      })

      return
    }

    const missingProducts = productIds.filter(
      (id) => !productPriceKeys.includes(id)
    )

    if (missingProducts.length > 0) {
      const res = await prompt({
        title: t(
          "price-list-add-products-modal-missing-prices-title",
          "Incomplete price list"
        ),
        description: t(
          "price-list-add-products-modal-missing-prices-description",
          "Prices have not been assigned to all of your chosen products. Would you like to continue?"
        ),
      })

      if (!res) {
        return
      }
    }

    for (const productId of Object.keys(data.prices.products)) {
      const product = data.prices.products[productId]

      for (const variantId of Object.keys(product.variants)) {
        const variant = product.variants[variantId]

        if (variant.currency) {
          for (const currencyCode of Object.keys(variant.currency)) {
            const { amount } = variant.currency[currencyCode]

            if (!amount) {
              continue
            }

            if (!currencyCode) {
              continue
            }

            const dbSafeAmount = getDbSafeAmount(
              currencyCode,
              parseFloat(amount)
            )

            if (!dbSafeAmount) {
              continue
            }

            const payload: PricePayload = {
              amount: dbSafeAmount,
              variant_id: variantId,
              currency_code: currencyCode,
            }

            prices.push(payload)
          }
        }

        if (variant.region) {
          for (const regionId of Object.keys(variant.region)) {
            const { amount } = variant.region[regionId]

            if (!amount) {
              continue
            }

            if (!regionId) {
              continue
            }

            const dbSafeAmount = getDbSafeAmount(
              regions.find((r) => r.id === regionId)!.currency_code,
              parseFloat(amount)
            )

            if (!dbSafeAmount) {
              continue
            }

            const payload: PricePayload = {
              amount: dbSafeAmount,
              variant_id: variantId,
              region_id: regionId,
            }

            prices.push(payload)
          }
        }
      }
    }

    const updateConfigOptionPrice = async (
      id: string,
      metadata: Option[]  ,
      _productType:string
    ) =>{
      let path = `/admin/custom/price-list`
      let payload = {
        action : "updateConfigOptionPrice",
        id:id,
        metadata:metadata,
        product_type:_productType

      }
      const {data} = await medusaRequest("POST", path, payload)
      return { ...data }
    }

    await mutateAsync(
      {
        prices,
      },
      {
        onSuccess: () => {
          //更新metadata中的configoption_price
          if (modifiedPrice) {
            const _res = updateConfigOptionPrice(priceList.id,modifiedPrice,productType)
            console.log("updateConfigOptionPrice",_res,modifiedPrice)
          }
          notification(
            t(
              "price-list-add-products-modal-success-title",
              "New prices added"
            ),
            t(
              "price-list-add-products-modal-success-message",
              "The new prices have been added to the price list."
            ),
            "success"
          )

          onCloseModal()
        },
        onError: (err) => {
          notification(
            t("price-list-add-products-modal-error-title", "An error occurred"),
            getErrorMessage(err),
            "error"
          )
        },
      }
    )
  })

  const onSetProduct = React.useCallback(
    (product: Product | null) => {
      if (!product) {
        setProduct(null)
        setTab(Tab.PRICES)
        return
      }

      const defaultValues = getValues(`prices.products.${product.id}`)
      resetEdit(defaultValues)
      setProduct(product)
      setTab(Tab.EDIT)
    },
    [resetEdit, getValues]
  )

    
  const onSetConfigOption = React.useCallback(
    (product: Product | null) => {
      if (!product) {
        setProduct(null)
        setTab(Tab.PRICES)
        return
      }
      setTab(Tab.CONFIGOPTION)
    },
    [resetEdit, getValues]
  )

  
 

  const onSetOptionSub = React.useCallback(
    (product: Product | null, configoption:ConfigOption | null) => {
      if (!product) {
        setProduct(null)
        setTab(Tab.PRICES)
        return
      }
      //修改configoption 子项 价格  修改为 priceList中metadata中的价格
      const subPrice = configoption?.options.option;
      
      const priceListSubPrice = priceList.metadata?.configoption_price;
      console.log("configoption before",priceList,subPrice,priceListSubPrice)
      if (subPrice && priceListSubPrice) {
        priceListSubPrice.forEach((item) => {
          const idx = subPrice.findIndex(dataItem => dataItem.id === item.id)
          if (idx !== -1) {
            configoption.options.option[idx] = item;
          }
        })
      }

      console.log("configoption after",configoption)
      
      setTab(Tab.CONFIGOPTIONSUB)
      setConfigOption(configoption)
      //setOptions(configoption?.options)

    },
    [resetEdit, getValues]
  )

  const onSetOptionSubPrice = React.useCallback(
    (options:Option[] | null) => {
      if (!options) {
        return
      }
      console.log("Pre Modified options",premodifiedPrice,options)
      
      setPremodifiedPrice(options)
      console.log("Pre Modified options",premodifiedPrice,options)

    },
    [resetEdit, getValues]
  )

  const onSetProductType = React.useCallback(
    (productType: string) => {
      setProductType(productType)
      console.log("productType",productType)
    },
    [resetEdit, getValues]
  )


  /**
   * When exiting the "Edit" tab, we need to check
   * if the user has unsaved changes. If they do,
   * we need to prompt them whether they want to
   * continue or not.
   */
  const onExitProductPrices = React.useCallback(
    async (tab = Tab.PRICES) => {
      if (isEditDirty) {
        const res = await prompt({
          title: promptTitle,
          description: promptBackDescription,
        })

        if (!res) {
          return
        }
      }

      const defaultValues = product
        ? getValues(`prices.products.${product.id}`)
        : undefined

      setTab(tab)
      setProduct(null)
      resetEdit(defaultValues, {
        keepDirty: false,
        keepTouched: false,
      })
    },
    [
      prompt,
      resetEdit,
      getValues,
      product,
      isEditDirty,
      promptTitle,
      promptBackDescription,
    ]
  )

  /**
   * If the current tab is edit, we need to
   * check if the user wants to exit the edit
   * tab or if they want to save the changes
   * before continuing.
   */
  const onTabChange = React.useCallback(
    async (value: Tab) => {
      if (tab === Tab.EDIT) {
        await onExitProductPrices(value)
        return
      }

      setTab(value)
    },
    [tab, onExitProductPrices]
  )

  /**
   * Callback for ensuring that we don't submit prices
   * for products that the user has unselected.
   */
  const onUpdateSelectedProductIds = React.useCallback(
    (ids: string[]) => {
      setSelectedIds((prev) => {
        /**
         * If the previous ids are the same as the new ids,
         * we need to clear the values the old ids that are no
         * longer selected.
         */
        for (const id of prev) {
          if (!ids.includes(id)) {
            setValue(`prices.products.${id}`, { variants: {} })
          }
        }

        return ids
      })
    },
    [setValue]
  )

  const onCancelPriceEdit = React.useCallback(async () => {
    if (!product) {
      setTab(Tab.PRICES)
      return
    }

    if (isEditDirty) {
      const res = await prompt({
        title: "Are you sure?",
        description: "You have unsaved changes, are you sure you want to exit?",
      })

      if (!res) {
        return
      }
    }

    const defaultValues = getValues(`prices.products.${product.id}`)

    setProduct(null)
    resetEdit(defaultValues)
    setTab(Tab.PRICES)
  }, [getValues, resetEdit, prompt, isEditDirty, product])

  /**
   * Callback for validating the products form.
   */
  const onValidateProducts = React.useCallback(async () => {
    const result = await trigger("products")

    if (!result) {
      setStatus((prev) => ({
        ...prev,
        [Tab.PRODUCTS]: "in-progress",
      }))
      return
    }

    const ids = getValues("products.ids")

    onUpdateSelectedProductIds(ids)

    setTab(Tab.PRICES)
    setStatus((prev) => ({
      ...prev,
      [Tab.PRODUCTS]: "completed",
    }))
  }, [trigger, getValues, onUpdateSelectedProductIds])

  const onBack = React.useCallback(async () => {
    switch (tab) {
      case Tab.PRODUCTS:
        onModalStateChange(false)
        break
      case Tab.PRICES:
        setTab(Tab.PRODUCTS)
        break
      case Tab.EDIT:
        await onCancelPriceEdit()
        break
      case Tab.CONFIGOPTION:
        setConfigOption(null)//重置configoption的值
        setModifiedPrice(null)//重置修改的价格
        setPremodifiedPrice(null)//重置预修改的价格
        setTab(Tab.EDIT)
        break
      case Tab.CONFIGOPTIONSUB:
        setConfigOption(null)
        setTab(Tab.CONFIGOPTION)
        break
    }
  }, [tab, onCancelPriceEdit, onModalStateChange])

  const backButtonText = React.useMemo(() => {
    switch (tab) {
      case Tab.PRODUCTS:
        return t("price-list-add-products-modal-back-button-cancel", "Cancel")
      default:
        return t("price-list-add-products-modal-back-button", "Back")
    }
  }, [tab, t])

  const onNext = React.useCallback(async () => {
    switch (tab) {
      case Tab.PRODUCTS:
        onValidateProducts()
        break
      case Tab.PRICES:
        await onSubmit()
        break
      case Tab.EDIT:
        await onSavePriceEdit()
        break
      case Tab.CONFIGOPTION:
          setTab(Tab.EDIT)
          break
      case Tab.CONFIGOPTIONSUB:
          await onSaveConfigOptionPriceEdit()
          break
    }
  }, [onValidateProducts, onSavePriceEdit, onSubmit, tab])

  const nextButtonText = React.useMemo(() => {
    switch (tab) {
      case Tab.PRODUCTS:
        return t(
          "price-list-add-products-modal-next-button-continue",
          "Continue"
        )
      case Tab.PRICES:
        return t(
          "price-list-add-products-modal-next-button-submit-and-close",
          "Submit and Close"
        )
      case Tab.EDIT:
        return t(
          "price-list-add-products-modal-next-button-continue-save-prices",
          "Save Prices"
        )
      case Tab.CONFIGOPTION:
        return "保存"
      case Tab.CONFIGOPTIONSUB:
        return "保存修改价格"
    }
  }, [tab, t])

  return (
    <FocusModal open={open} onOpenChange={onModalStateChange}>
      <ProgressTabs
        value={tab}
        onValueChange={(tab) => onTabChange(tab as Tab)}
      >
        <FocusModal.Content>
          <FocusModal.Header className="flex w-full items-center justify-between">
            <ProgressTabs.List className="border-ui-border-base -my-2 ml-2 min-w-0 flex-1 border-l">
              <ProgressTabs.Trigger
                value={Tab.PRODUCTS}
                className="w-full max-w-[200px]"
                status={status[Tab.PRODUCTS]}
              >
                <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {t(
                    "price-list-add-products-modal-products-tab",
                    "Choose Products"
                  )}
                </span>
              </ProgressTabs.Trigger>
              <ProgressTabs.Trigger
                disabled={status[Tab.PRODUCTS] !== "completed"}
                value={Tab.PRICES}
                className="w-full max-w-[200px]"
                status={status[Tab.PRICES]}
              >
                <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {t("price-list-add-products-modal-prices-tab", "Edit Prices")}
                </span>
              </ProgressTabs.Trigger>
              {product && (
                <ProgressTabs.Trigger
                  value={Tab.EDIT}
                  className="w-full max-w-[200px]"
                  status={isEditDirty ? "in-progress" : "not-started"}
                >
                  <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {product.title}
                  </span>
                </ProgressTabs.Trigger>
              )}
              {product && (
                <ProgressTabs.Trigger
                  value={Tab.CONFIGOPTION}
                  disabled={isLoading || isError}
                  className="w-full min-w-0 max-w-[200px]"
                  status={isEditDirty ? "in-progress" : "not-started"}
                >
                  Config Options
                </ProgressTabs.Trigger>
              )}
              {product && configoption && (
                <ProgressTabs.Trigger
                  value={Tab.CONFIGOPTIONSUB}
                  disabled={isLoading || isError}
                  className="w-full min-w-0 max-w-[200px]"
                  status={isEditDirty ? "in-progress" : "not-started"}
                >
                  Config Options Prices
                </ProgressTabs.Trigger>
              )}
            </ProgressTabs.List>
            <div className="flex flex-1 items-center justify-end gap-x-2">
              <Button
                disabled={isSubmitting}
                variant="secondary"
                onClick={onBack}
              >
                {backButtonText}
              </Button>
              <Button
                type="button"
                className="whitespace-nowrap"
                isLoading={isSubmitting}
                onClick={onNext}
              >
                {nextButtonText}
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex h-full w-full flex-col items-center overflow-y-auto">
            <Form {...form}>
              <ProgressTabs.Content
                value={Tab.PRODUCTS}
                className="h-full w-full"
              >
                <div className="flex items-center px-4 py-2.5">
                  <ProductTypeRadio setProductType={onSetProductType} defaultProductType={productType}/>
                </div>
                
                <PriceListProductsForm
                  form={nestedForm(form, "products")}
                  productIds={productIds}
                />
              </ProgressTabs.Content>
              <ProgressTabs.Content
                value={Tab.PRICES}
                className="h-full w-full"
              >
                {isLoading ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Spinner className="text-ui-fg-subtle animate-spin" />
                  </div>
                ) : isError || isNotFound ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-ui-fg-subtle flex items-center gap-x-2">
                      <ExclamationCircle />
                      <Text>
                        {t(
                          "price-list-add-products-modal-error",
                          "An error occurred while preparing the form. Reload the page and try again. If the issue persists, try again later."
                        )}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <PriceListPricesForm
                    setProduct={onSetProduct}
                    form={nestedForm(form, "prices")}
                    productIds={selectedIds}
                  />
                )}
              </ProgressTabs.Content>
              {product && (
                <ProgressTabs.Content
                  value={Tab.EDIT}
                  className="h-full w-full"
                >
                  {isLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Spinner className="text-ui-fg-subtle animate-spin" />
                    </div>
                  ) : isError || isNotFound ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-ui-fg-subtle flex items-center gap-x-2">
                        <ExclamationCircle />
                        <Text>
                          {t(
                            "price-list-add-products-modal-error",
                            "An error occurred while preparing the form. Reload the page and try again. If the issue persists, try again later."
                          )}
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center px-4 py-2.5">
                        <Button
                            onClick={() => {
                              onSetConfigOption(product)
                              setPremodifiedPrice(null)//重置预修改的价格
                            }}
                          >
                            Set Config Options
                        </Button>
                      </div>
                      <PriceListProductPricesForm
                        product={product}
                        currencies={currencies}
                        regions={regions}
                        control={editControl}
                        priceListTaxInclusive={priceList.includes_tax}
                        taxInclEnabled={isTaxInclPricesEnabled}
                        setValue={setEditValue}
                        getValues={getEditValues}
                      />
                    </>
                  )}
                </ProgressTabs.Content>
              )}
              {product && (
                  <ProgressTabs.Content
                    value={Tab.CONFIGOPTION}
                    className="h-full w-full"
                  >
                    <div className="px-8 py-12">
                      <PriceListConfigOptionForm
                        product={product}
                        setOptionSub = {onSetOptionSub}

                      />

                    </div>
                  </ProgressTabs.Content>
                )}
                {product && (
                  <ProgressTabs.Content
                    value={Tab.CONFIGOPTIONSUB}
                    className="h-full w-full"
                  >
                    <div className="px-8 py-12">
                      
                      <ConfigOptionSubPrice
                        product={product}
                        configoption={configoption}
                        setOptionSubPrice={onSetOptionSubPrice}
                        modifiedPrice={modifiedPrice || []} // Add type guard to handle undefined case
                      />
                      
                    </div>
                  </ProgressTabs.Content>
                )}
            </Form>
          </FocusModal.Body>
        </FocusModal.Content>
      </ProgressTabs>
    </FocusModal>
  )
}

export { AddProductsModal }
