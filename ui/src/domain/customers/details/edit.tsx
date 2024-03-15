import { Customer } from "@medusajs/medusa"
import { useAdminUpdateCustomer } from "medusa-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import MetadataForm, {
  getMetadataFormValues,
  getSubmittableMetadata,
  MetadataFormType,
} from "../../../components/forms/general/metadata-form"
import Button from "../../../components/fundamentals/button"
import LockIcon from "../../../components/fundamentals/icons/lock-icon"
import InputField from "../../../components/molecules/input"
import Modal from "../../../components/molecules/modal"
import useNotification from "../../../hooks/use-notification"
import { getErrorMessage } from "../../../utils/error-messages"
import { nestedForm } from "../../../utils/nested-form"
import { validateEmail } from "../../../utils/validate-email"
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { useCustomerTagGroup, useAdminCustomerUpdateTagGroup } from "../../../hooks/customer/use-admin-customers";

type EditCustomerModalProps = {
  customer: Customer
  handleClose: () => void
}

type EditCustomerFormType = {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  metadata: MetadataFormType
}

const EditCustomerModal = ({
  handleClose,
  customer,
}: EditCustomerModalProps) => {
  const { t } = useTranslation()

  const form = useForm<EditCustomerFormType>({
    defaultValues: getDefaultValues(customer),
  })

  const {
    register,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = form

  const { groups, tags } = useCustomerTagGroup({action: "taggroup"})
  const groups_options: SelectProps['options'] = [];
  const tags_options: SelectProps['options'] = [];
  let groups_select: Array<string> = [];
  let tags_select: Array<string> = [];

  customer.groups.map(group => {
      groups_select.push(group.id)
  })
  customer.tags.map(tag => {
      tags_select.push(tag.id)
  })

  const notification = useNotification()

  const updateCustomer = useAdminUpdateCustomer(customer.id)

  const onSubmit = handleSubmit(async (data) => {
    await useAdminCustomerUpdateTagGroup({
      action: "updateTagAndGroup",
      groups: groups_select,
      tags: tags_select,
      customer_id: customer.id,
    }, {
      "content-type": "application/json"
    })
    updateCustomer.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        // @ts-ignore
        phone: data.phone,
        email: data.email,
        metadata: getSubmittableMetadata(data.metadata),
      },
      {
        onSuccess: () => {
          handleClose()
          notification(
            t("details-success", "Success"),
            t(
              "details-successfully-updated-customer",
              "Successfully updated customer"
            ),
            "success"
          )
        },
        onError: (err) => {
          handleClose()
          notification(
            t("details-error", "Error"),
            getErrorMessage(err),
            "error"
          )
        },
      }
    )
  })

  useEffect(() => {
    reset(getDefaultValues(customer))
  }, [customer])

  for (let item in (groups || [])) {
    groups_options.push({
      value: groups[item].id,
      label: groups[item].name
    })
  }
  for (let item in (tags || [])) {
    tags_options.push({
      value: tags[item].id,
      label: tags[item].value
    })
  }

  const handleGroupChange = (value: string[]) => {
    groups_select = value
  };
  const handleTagChange = (value: string[]) => {
    tags_select = value
  };
  return (
    <Modal handleClose={handleClose}>
      <Modal.Body>
        <Modal.Header handleClose={handleClose}>
          <span className="inter-xlarge-semibold">
            {t("details-customer-details", "Customer Details")}
          </span>
        </Modal.Header>
        <Modal.Content>
          <div className="gap-y-xlarge flex flex-col">
            <div>
              <h2 className="inter-base-semibold text-grey-90 mb-4">
                {t("details-general", "General")}
              </h2>
              <div className="flex w-full space-x-2">
                <InputField
                  label={t("details-first-name", "First Name")}
                  {...register("first_name")}
                  placeholder={t("details-lebron", "Lebron")}
                />
                <InputField
                  label={t("details-last-name", "Last Name")}
                  {...register("last_name")}
                  placeholder={t("details-james", "James")}
                />
              </div>
            </div>
            <div>
              <h2 className="inter-base-semibold text-grey-90 mb-4">Contact</h2>
              <div className="flex space-x-2">
                <InputField
                  label={t("details-email", "Email")}
                  {...register("email", {
                    validate: (value) => !!validateEmail(value),
                    disabled: customer.has_account,
                  })}
                  prefix={
                    customer.has_account && (
                      <LockIcon size={16} className="text-grey-50" />
                    )
                  }
                  disabled={customer.has_account}
                />
                <InputField
                  label={t("details-phone-number", "Phone number")}
                  {...register("phone")}
                  placeholder="+45 42 42 42 42"
                />
              </div>
              <div className="flex space-x-2">
                <div className="w-full">
                  <div className="inter-small-semibold text-grey-50 flex w-full items-center mb-xsmall">
                    <label>{t("details-groups", "Groups")}</label>
                  </div>
                  <Select
                      mode="multiple"
                      size="large"
                      placeholder="Please select"
                      onChange={handleGroupChange}
                      defaultValue={customer?.groups.map((item) => item.id)}
                      style={{ width: '100%' }}
                      options={groups_options}
                  />
                  {/*<Controller*/}
                  {/*    {...register("groups")}*/}
                  {/*    control={control}*/}
                  {/*    rules={{ required: true }}*/}
                  {/*    render={({ field: { onChange } }) => (*/}
                  {/*        <Select*/}
                  {/*            mode="multiple"*/}
                  {/*            size="large"*/}
                  {/*            placeholder="Please select"*/}
                  {/*            onChange={onChange}*/}
                  {/*            defaultValue={[]}*/}
                  {/*            style={{ width: '100%' }}*/}
                  {/*            options={groups_options}*/}
                  {/*        />*/}
                  {/*    )}*/}
                  {/*/>*/}
                </div>
                <div className="w-full">
                  <div className="inter-small-semibold text-grey-50 flex w-full items-center mb-xsmall">
                    <label>{t("details-tags", "Tags")}</label>
                  </div>
                  {/*<Controller*/}
                  {/*    {...register("tags")}*/}
                  {/*    control={control}*/}
                  {/*    rules={{ required: true }}*/}
                  {/*    render={({ field: { onChange } }) => (*/}
                  {/*        <Select*/}
                  {/*            mode="multiple"*/}
                  {/*            size="large"*/}
                  {/*            placeholder="Please select"*/}
                  {/*            onChange={onChange}*/}
                  {/*            defaultValue={[]}*/}
                  {/*            style={{ width: '100%' }}*/}
                  {/*            options={tags_options}*/}
                  {/*        />*/}
                  {/*    )}*/}
                  {/*/>*/}
                  <Select
                      mode="multiple"
                      size="large"
                      placeholder="Please select"
                      onChange={handleTagChange}
                      defaultValue={customer?.tags.map((item) => item.id)}
                      style={{ width: '100%' }}
                      options={tags_options}
                  />
                </div>
              </div>
            </div>
            <div>
              <h2 className="inter-base-semibold mb-base">
                {t("details-metadata", "Metadata")}
              </h2>
              <MetadataForm form={nestedForm(form, "metadata")} />
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end">
            <Button
              variant="secondary"
              size="small"
              onClick={handleClose}
              className="mr-2"
              type="button"
            >
              {t("details-cancel", "Cancel")}
            </Button>
            <Button
              loading={updateCustomer.isLoading}
              disabled={ updateCustomer.isLoading}
              variant="primary"
              size="small"
              onClick={onSubmit}
            >
              {t("details-save-and-close", "Save and close")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}

const getDefaultValues = (customer: Customer): EditCustomerFormType => {
  return {
    first_name: customer.first_name,
    email: customer.email,
    last_name: customer.last_name,
    phone: customer.phone,
    metadata: getMetadataFormValues(customer.metadata),
  }
}

export default EditCustomerModal
