import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  FocusModal,
  ProgressTabs,
  Text,
  usePrompt,
  type ProgressStatus,
  Container,
  Heading,
} from "@medusajs/ui"
import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"

import { Product } from "@medusajs/medusa"
import { useAdminCreatePriceList } from "medusa-react"
import { Form } from "../../../components/helpers/form"
import useNotification from "../../../hooks/use-notification"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"
import { getErrorMessage } from "../../../utils/error-messages"
import { nestedForm } from "../../../utils/nested-form"

import {
  PriceListDetailsForm,
  priceListDetailsSchema,
  PriceListStatus,
  PriceListType,
} from "../forms/price-list-details-form"

import {
  getDbSafeAmount,
  PriceListPricesForm,
  priceListPricesSchema,
  usePricesFormData,
  type PricePayload,
} from "../forms/price-list-prices-form"

import {
  PriceListProductPricesForm,
  priceListProductPricesSchema,
  type PriceListProductPricesSchema,
} from "../forms/price-list-product-prices-form"

import { ExclamationCircle, PlusMini, Spinner } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import {
  PriceListProductsForm,
  priceListProductsSchema,
} from "../forms/price-list-products-form"

import PriceListConfigOptionForm, { ConfigOption } from "../forms/price-list-configoption-form/configoption"
import { Option } from "../forms/price-list-configoption-form/configoption"
import ConfigOptionSubPrice from "../forms/price-list-configoption-form/configoption-sub-price"
import { useState } from "react"
import { Space } from "antd"
import medusaRequest from "../../../services/request"
import ProductTypeRadio from "../forms/price-list-configoption-form/product-type-radio"

enum Tab {
  DETAILS = "details",
  PRODUCTS = "products",
  PRICES = "prices",
  EDIT = "edit",
  CONFIGOPTION = "Config Options",
  CONFIGOPTIONSUB = "configoption prices ",
}

const priceListNewSchema = z.object({
  details: priceListDetailsSchema,
  products: priceListProductsSchema,
  prices: priceListPricesSchema,
})

type PriceListNewSchema = z.infer<typeof priceListNewSchema>

type StepStatus = {
  [key in Tab]: ProgressStatus
}

const PriceListNew = () => {
  const [open, setOpen] = React.useState(false)
  const [product, setProduct] = React.useState<Product | null>(null)
  const [configoption, setConfigOption] = React.useState<ConfigOption | null>(null)
  const [modifiedPrice,setModifiedPrice] = useState<Option[]| null>(); //修改的配置子项
  const [premodifiedPrice,setPremodifiedPrice] = useState<Option[]|null>(); //预修改的配置子项
  const [productType,setProductType] = React.useState("product"); //产品类型

  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const [tab, setTab] = React.useState<Tab>(Tab.DETAILS)
  const [status, setStatus] = React.useState<StepStatus>({
    [Tab.DETAILS]: "not-started",
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

  const form = useForm<PriceListNewSchema>({
    resolver: zodResolver(priceListNewSchema),
    defaultValues: {
      details: {
        type: {
          value: "sale",
        },
        general: {
          name: "",
          description: "",
          tax_inclusive: false,
        },
        customer_groups: {
          ids: [],
        },
        customer_tags: {
          ids: []
        },
        dates: {
          ends_at: null,
          starts_at: null,
        },
      },
      products: {
        ids: [],
      },
      prices: {
        products: {},
      },
    },
  })

  const {
    trigger,
    reset,
    getValues,
    setValue,
    setError,
    handleSubmit,
    formState: { isDirty },
  } = form

  const taxToggleState = useWatch({
    control: form.control,
    name: "details.general.tax_inclusive",
    defaultValue: false,
  })

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { isDirty: isEditDirty },
    setValue: setEditValue,
    getValues: getEditValues,
  } = useForm<PriceListProductPricesSchema>({
    resolver: zodResolver(priceListProductPricesSchema),
  })

  const { mutateAsync, isLoading: isSubmitting } = useAdminCreatePriceList()

  const { isLoading, isError, isNotFound, regions, currencies } =
    usePricesFormData({
      productIds: selectedIds,
      enable: {
        products: false,
      },
    })

  //作用是关闭模态窗口，并重置相关的状态和表单。
  const onCloseModal = React.useCallback(() => {
    setOpen(false)
    setTab(Tab.DETAILS)
    setSelectedIds([])
    setStatus({
      [Tab.DETAILS]: "not-started",
      [Tab.PRODUCTS]: "not-started",
      [Tab.PRICES]: "not-started",
      [Tab.EDIT]: "not-started",
      [Tab.CONFIGOPTION]: "not-started",  
      [Tab.CONFIGOPTIONSUB]: "not-started",
    })
    resetEdit()
    reset()
  }, [reset, resetEdit])

  //作用是处理模态窗口的打开和关闭，当模态窗口关闭时，如果表单已被修改，会弹出提示框询问用户是否确定离开。
  const onModalStateChange = React.useCallback(
    async (open: boolean) => {
      if (!open && (isDirty || isEditDirty)) {
        const response = await prompt({
          title: promptTitle,
          description: promptExitDescription,
        })

        if (!response) {
          setOpen(true)
          return
        }

        onCloseModal()
      }

      setOpen(open)
    },
    [
      isDirty,
      isEditDirty,
      promptTitle,
      promptExitDescription,
      prompt,
      onCloseModal,
    ]
  )

  //作用是在 "Save Prices" 按钮被点击时，更新表单中对应产品的价格，并重置相关的状态和选项卡。
  /**
   * On hitting "Save Prices" in the edit tab, we need
   * to update the corresponding product in the form.
   */
  const onSavePriceEdit = handleEditSubmit((data) => {
    if (!product) {
      return
    }

    setValue(`prices.products.${product.id}`, data, {
      shouldDirty: true,//设置为 true 表示这个字段已被修改
      shouldTouch: true,//设置为 true 表示这个字段已被访问。
    })

    setProduct(null)//重置 product 的值
    resetEdit(undefined, {//重置编辑状态
      keepDirty: false,
      keepTouched: false,
    })
    setTab(Tab.PRICES)//将当前的选项卡设置为 "PRICES"。
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

  //作用是处理表单提交，创建价格列表，并处理相关的错误和成功的情况。
  const onSubmit = React.useCallback(
    async (status: PriceListStatus) => {
      await handleSubmit(async (data) => {//回调函数会在表单提交时被调用，它接收表单的值作为参数。
        const prices: PricePayload[] = []

        const productPriceKeys = Object.keys(data.prices.products)
        const productIds = data.products.ids

        if (!productPriceKeys.length || !data.prices.products) {
          setError("prices.products", {
            type: "manual",
            message: t(
              "price-list-new-form-no-prices-error",
              "Please set prices for at least one product."
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
              "price-list-new-form-missing-prices-title",
              "Incomplete price list"
            ),
            description: t(
              "price-list-new-products-modal-missing-prices-description",
              "Prices have not been assigned to all of your chosen products. Would you like to proceed?"
            ),
          })

          if (!res) {
            return
          }
        }

        /**
         * Loop through all the products and variants
         * and create a payload for each price.
         *
         * If a price does not have an amount, we
         * skip it.
         */
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

        await mutateAsync(//调用 mutateAsync 函数提交表单。
          {
            name: data.details.general.name,
            description: data.details.general.description,
            type: data.details.type.value as PriceListType,
            includes_tax: isTaxInclPricesEnabled
              ? data.details.general.tax_inclusive
              : undefined,
            customer_groups: data.details.customer_groups.ids.map((id) => ({
              id,
            })),
            customer_tags: data.details.customer_tags.ids.map((id) => ({
              id,
            })),
            status: status,
            ends_at: data.details.dates.ends_at || undefined,
            starts_at: data.details.dates.starts_at || undefined,
            prices,
            // metadata: {}
          },
          {
            onSuccess: (response) => {
              console.log("response",response)
              //读取id 将configoption的价格保存到metadata中
              const priceListId = response.price_list.id
              // let metadata = JSON.stringify(modifiedPrice)
              // console.log("metadata",metadata,modifiedPrice)
              const _res = updateConfigOptionPrice(priceListId,modifiedPrice || [],productType)
              console.log("updateConfigOptionPrice",_res)

              notification(
                t(
                  "price-list-new-form-notification-success-title",
                  "Price list created"
                ),
                t(
                  "price-list-new-form-notification-success-message",
                  `Successfully created price list`
                ),
                "success"
              )

              onCloseModal()
            },
            onError: (err) => {
              notification(
                t(
                  "price-list-new-form-notification-error-title",
                  "An error occurred"
                ),
                getErrorMessage(err),
                "error"
              )
            },
          }
        )

        // let post_path = "/admin/custom/price-list"
        // await medusaRequest("POST", post_path, {
        //   name: data.details.general.name,
        //   description: data.details.general.description,
        //   type: data.details.type.value as PriceListType,
        //   includes_tax: isTaxInclPricesEnabled
        //     ? data.details.general.tax_inclusive
        //     : undefined,
        //   customer_groups: data.details.customer_groups.ids.map((id) => ({
        //     id,
        //   })),
        //   customer_tags: data.details.customer_tags.ids.map((id) => ({
        //     id,
        //   })),
        //   status: status,
        //   ends_at: data.details.dates.ends_at || undefined,
        //   starts_at: data.details.dates.starts_at || undefined,
        //   prices,
        // })
        // notification(
        //   t(
        //     "price-list-new-form-notification-success-title",
        //     "Price list created"
        //   ),
        //   t(
        //     "price-list-new-form-notification-success-message",
        //     `Successfully created price list`
        //   ),
        //   "success"
        // )

        onCloseModal()


        // await mutateAsync(
        //   {
        //     name: data.details.general.name,
        //     description: data.details.general.description,
        //     type: data.details.type.value as PriceListType,
        //     includes_tax: isTaxInclPricesEnabled
        //       ? data.details.general.tax_inclusive
        //       : undefined,
        //     customer_groups: data.details.customer_groups.ids.map((id) => ({
        //       id,
        //     })),
        //     customer_tags: data.details.customer_tags.ids.map((id) => ({
        //       id,
        //     })),
        //     status: status,
        //     ends_at: data.details.dates.ends_at || undefined,
        //     starts_at: data.details.dates.starts_at || undefined,
        //     prices,
        //   },
        //   {
        //     onSuccess: () => {
        //       notification(
        //         t(
        //           "price-list-new-form-notification-success-title",
        //           "Price list created"
        //         ),
        //         t(
        //           "price-list-new-form-notification-success-message",
        //           `Successfully created price list`
        //         ),
        //         "success"
        //       )
        //
        //       onCloseModal()
        //     },
        //     onError: (err) => {
        //       notification(
        //         t(
        //           "price-list-new-form-notification-error-title",
        //           "An error occurred"
        //         ),
        //         getErrorMessage(err),
        //         "error"
        //       )
        //     },
        //   }
        // )
      })()
    },
    [
      handleSubmit,
      mutateAsync,
      notification,
      onCloseModal,
      setError,
      prompt,
      t,
      isTaxInclPricesEnabled,
      regions,
    ]
  )
  //设置当前选中的产品，并根据产品是否存在来切换选项卡和重置编辑状态。
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

  //作用是在退出 "Edit" 选项卡时，检查用户是否有未保存的更改，如果有，那么会提示用户是否要继续，如果用户选择了继续，那么会切换选项卡并重置相关的状态。
  /**
   * When exiting the "Edit" tab, we need to check
   * if the user has unsaved changes. If they do,
   * we need to prompt them whether they want to
   * continue or not.
   */
  const onExitProductPrices = React.useCallback(
    async (tab = Tab.PRICES) => {
      if (isEditDirty) {//表示编辑状态是否已被修改。
        const res = await prompt({//弹出一个提示框询问用户是否要继续
          title: promptTitle,
          description: promptBackDescription,
        })

        if (!res) {
          return
        }
      }

      setTab(tab)
      setProduct(null)
      resetEdit(undefined, {
        keepDirty: false,
        keepTouched: false,
      })
    },
    [prompt, resetEdit, isEditDirty, promptTitle, promptBackDescription]
  )

  //用是在切换选项卡时，如果当前的选项卡是 "EDIT"，那么会检查用户是否有未保存的更改，如果有，那么会提示用户是否要保存更改，如果用户选择了保存，那么会保存更改并切换选项卡，如果用户选择了不保存，那么会直接切换选项卡。
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
   * 作用是更新选中的产品 ID 列表，并重置用户已经取消选中的产品的价格信息。
   */
  const onUpdateSelectedProductIds = React.useCallback(
    (ids: string[]) => {
      setSelectedIds((prev) => {
        /**
         * If the previous ids are the same as the new ids,
         * we need to unregister the old ids that are no
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

  /**
   * Callback for validating the details form.
   * 作用是验证 "details" 表单，如果验证失败，那么会更新状态并立即返回，如果验证成功，那么会切换到 "PRODUCTS" 选项卡并更新状态。
   */
  const onValidateDetails = React.useCallback(async () => {
    const result = await trigger("details")

    if (!result) {
      setStatus((prev) => ({
        ...prev,
        [Tab.DETAILS]: "in-progress",
      }))

      return
    }

    setTab(Tab.PRODUCTS)
    setStatus((prev) => ({
      ...prev,
      [Tab.DETAILS]: "completed",
    }))
  }, [trigger])

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

  /**
   * Depending on the current tab, the next button
   * will have different functionality.
   */
  const onNext = React.useCallback(async () => {
    switch (tab) {
      case Tab.DETAILS:
        await onValidateDetails()
        break
      case Tab.PRODUCTS:
        await onValidateProducts()
        break
      case Tab.PRICES:
        await onSubmit(PriceListStatus.ACTIVE)
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
  }, [onValidateDetails, onValidateProducts, onSubmit, onSavePriceEdit,onSaveConfigOptionPriceEdit, tab])

  const nextButtonText = React.useMemo(() => {
    switch (tab) {
      case Tab.PRICES:
        return t(
          "price-list-new-form-next-button-save-and-publish",
          "Save and Publish"
        )
      case Tab.EDIT:
        return t("price-list-new-form-next-button-save", "Save Prices")
      case Tab.CONFIGOPTION:
        return "保存"
      case Tab.CONFIGOPTIONSUB:
        return "保存修改价格"
      default:
        return t("price-list-new-form-next-button-continue", "Continue")
    }
  }, [tab, t])

  /**
   * Depending on the current tab, the back button
   * will have different functionality.
   */
  const onBack = React.useCallback(async () => {
    switch (tab) {
      case Tab.DETAILS:
        await onModalStateChange(false)
        break
      case Tab.PRODUCTS:
        setTab(Tab.DETAILS)
        break
      case Tab.PRICES:
        setTab(Tab.PRODUCTS)
        break
      case Tab.EDIT:
        await onExitProductPrices()
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
  }, [onModalStateChange, onExitProductPrices, tab])

  const backButtonText = React.useMemo(() => {
    switch (tab) {
      case Tab.DETAILS:
        return t("price-list-new-form-back-button-cancel", "Cancel")
      default:
        return t("price-list-new-form-back-button-back", "Back")
    }
  }, [tab, t])

  return (
    <FocusModal open={open} onOpenChange={onModalStateChange}>
      <FocusModal.Trigger asChild>
        <Button variant="secondary">Create New</Button>
      </FocusModal.Trigger>
      <ProgressTabs
        value={tab}
        onValueChange={(tab) => onTabChange(tab as Tab)}
      >
        <FocusModal.Content>
          <FocusModal.Header className="flex w-full items-center justify-start">
            <ProgressTabs.List className="border-ui-border-base -my-2 ml-2 min-w-0 flex-1 border-l">
              <ProgressTabs.Trigger
                value={Tab.DETAILS}
                className="w-full min-w-0 max-w-[200px]"
                status={status[Tab.DETAILS]}
              >
                <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {t("price-list-new-form-details-tab", "Create Price List")}
                </span>
              </ProgressTabs.Trigger>
              <ProgressTabs.Trigger
                value={Tab.PRODUCTS}
                disabled={status[Tab.DETAILS] !== "completed"}
                className="w-full min-w-0  max-w-[200px]"
                status={status[Tab.PRODUCTS]}
              >
                <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {t("price-list-new-form-products-tab", "Choose Products")}
                </span>
              </ProgressTabs.Trigger>
              <ProgressTabs.Trigger
                value={Tab.PRICES}
                disabled={
                  status[Tab.DETAILS] !== "completed" ||
                  status[Tab.PRODUCTS] !== "completed"
                }
                className="w-full min-w-0 max-w-[200px]"
                status={status[Tab.PRICES]}
              >
                <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {t("price-list-new-form-prices-tab", "Edit Prices")}
                </span>
              </ProgressTabs.Trigger>
              {product && (
                <ProgressTabs.Trigger
                  value={Tab.EDIT}
                  disabled={isLoading || isError}
                  className="w-full min-w-0 max-w-[200px]"
                  status={isEditDirty ? "in-progress" : "not-started"}
                >
                  <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {product?.title}
                  </span>
                </ProgressTabs.Trigger>
              )}
              {product && (
                <ProgressTabs.Trigger
                  value={Tab.CONFIGOPTION}
                  disabled={isLoading || isError}
                  className="w-full min-w-0 max-w-[200px]"
                  status={status[Tab.CONFIGOPTION]}
                >
                  Config Options
                </ProgressTabs.Trigger>
              )}
              {product && configoption && (
                <ProgressTabs.Trigger
                  value={Tab.CONFIGOPTIONSUB}
                  disabled={isLoading || isError}
                  className="w-full min-w-0 max-w-[200px]"
                  status={status[Tab.CONFIGOPTIONSUB]}
                >
                  Config Options Prices
                </ProgressTabs.Trigger>
              )}
            </ProgressTabs.List>
            <div className="ml-auto flex items-center justify-end gap-x-2">
              <Button
                variant="secondary"
                onClick={onBack}
                disabled={isSubmitting}
              >
                {backButtonText}
              </Button>
              {tab === Tab.PRICES && !isSubmitting && (
                <Button onClick={() => onSubmit(PriceListStatus.DRAFT)}>
                  {t("price-list-new-form-save-as-draft", "Save as Draft")}
                </Button>
              )}
              <Button type="button" onClick={onNext} isLoading={isSubmitting}>
                {nextButtonText}
              </Button>
            </div>
          </FocusModal.Header>
          {open && (
            <FocusModal.Body className="flex h-full w-full flex-col items-center overflow-y-auto">
              <Form {...form}>
                <ProgressTabs.Content
                  value={Tab.DETAILS}
                  className="h-full w-full max-w-[720px]"
                >
                  <div className="px-8 py-12">
                    <PriceListDetailsForm
                      form={nestedForm(form, "details")}
                      layout="focus"
                      enableTaxToggle={isTaxInclPricesEnabled}
                    />
                  </div>
                </ProgressTabs.Content>
                <ProgressTabs.Content
                  value={Tab.PRODUCTS}
                  className="h-full w-full"
                >
                  <div className="flex items-center px-4 py-2.5">
                    <ProductTypeRadio setProductType={onSetProductType} defaultProductType={productType}/>
                  </div>
                  <PriceListProductsForm form={nestedForm(form, "products")} />
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
                            "price-list-new-form-error-loading-products",
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
                              "price-list-new-form-error-loading-products",
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
                              console.log("设置CF",product)
                            }}
                          >
                            Set Config Options
                        </Button>
                      </div>
                      
                      <PriceListProductPricesForm
                        priceListTaxInclusive={taxToggleState}
                        taxInclEnabled={isTaxInclPricesEnabled}
                        product={product}
                        currencies={currencies}
                        regions={regions}
                        control={editControl}
                        getValues={getEditValues}
                        setValue={setEditValue}
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
          )}
        </FocusModal.Content>
      </ProgressTabs>
    </FocusModal>
  )
}

export { PriceListNew }
