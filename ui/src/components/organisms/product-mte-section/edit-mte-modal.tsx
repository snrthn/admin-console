import { Product } from "@medusajs/client-types"
import {useEffect, useRef, useState} from "react"
import Fade from "../../atoms/fade-wrapper"
import Button from "../../fundamentals/button"
import CrossIcon from "../../fundamentals/icons/cross-icon"
import Modal from "../../molecules/modal"
import DeletePrompt from "../delete-prompt"
import { useAdminProductsDetailMte } from "../../../hooks/product/use-admin-product-detail-mte"
import {Editor} from "@tinymce/tinymce-react";

type EditMteModalProps = {
  close: () => void
  product: Product
}

/**
 * Edit Mte modal container.
 */
function EditMteModal(props: EditMteModalProps) {

  const [showCloseConfirmationPrompt, setShowCloseConfirmationPrompt] =
    useState(false)

  const { setMte } = useAdminProductsDetailMte()

  const onSave = async () => {
    await setMte(editorRef.current.getContent(), props.product.id)
    props.close()
  }

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCloseConfirmationPrompt(true)
      }
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [])

  const editorRef = useRef(null);

  return (
    <Fade isFullScreen isVisible>
      <Modal.Body className="border bg-gray-200 p-2">
        <div className="h-full overflow-hidden rounded-lg border border-gray-300 bg-white">
          <div className="flex h-[64px] items-center justify-between px-4">
            <div className="flex h-[20px] items-center gap-2">
              <Button
                variant="ghost"
                size="small"
                onClick={() => setShowCloseConfirmationPrompt(true)}
                className="text-grey-50 cursor-pointer"
              >
                <CrossIcon size={20} />
              </Button>
              <span className="text-small rounded-lg border border-2 border-gray-300 bg-gray-100 px-2 font-medium text-gray-500">
                esc
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="small"
                onClick={props.close}
                className="text-black-800  cursor-pointer border p-1.5 font-medium"
              >
                Discard
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={onSave}
                className="cursor-pointer border bg-black p-1.5 font-medium text-white hover:bg-black"
              >
                Save and close
              </Button>
            </div>
          </div>
          <Modal.Content>
            <Editor
              tinymceScriptSrc={'/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={ props.product.detail_id }
              init={{
                height: 500,
                menubar: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          </Modal.Content>
        </div>
      </Modal.Body>
      {showCloseConfirmationPrompt && (
        <DeletePrompt
          handleClose={() => setShowCloseConfirmationPrompt(false)}
          onDelete={async () => props.close()}
          successText={""}
          confirmText="Yes, close"
          heading="Close"
          text="Are you sure you want to close this editor without saving?"
        />
      )}
    </Fade>
  )
}

export default EditMteModal
