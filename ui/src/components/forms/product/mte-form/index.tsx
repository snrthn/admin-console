import { NestedForm } from "../../../../utils/nested-form"
import {Editor} from "@tinymce/tinymce-react";
import {useRef} from "react";

export type MteFormType = {
  detail_id: string
}

type Props = {
  form: NestedForm<MteFormType>
}

const MteForm = ({ form }: Props) => {
  const editorRef = useRef(null);
  const { path, setValue } = form

  const handleChange = () => {
    console.log("change12")
    setValue(
      path("detail_id"),
      editorRef.current.getContent()
    )
  }
  return (
    <div>
      <div>
        <div className="mt-large">
          <Editor
            onChange={handleChange}
            tinymceScriptSrc={'/tinymce/tinymce.min.js'}
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue=''
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
        </div>
      </div>
    </div>
  )
}

export default MteForm
