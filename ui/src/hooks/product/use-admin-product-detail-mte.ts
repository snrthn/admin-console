import medusaRequest from "../../services/request";

export const useAdminProductsDetailMte = () => {
  const setMte = async function (value: string, product_id: string) {
    const {data} = await medusaRequest(
      "POST",
      "/admin/custom/product",
      {
        text: value,
        action: "setMte",
        product_id: product_id,
      }
    )
    return { ...data } as const
  }
  return {
    setMte,
  }
}
