import React from "react"
import { useAdminCancelBatchJob } from "medusa-react"
import { Button, message } from 'antd'; // Assuming you're using Ant Design
import medusaRequest from "../../../services/request";

type Props = {
    batchJobId: string
}

const CancelBatchJob = ({ batchJobId }: Props) => {
    const cancelBatchJob = useAdminCancelBatchJob(batchJobId)

    const handleCancel = async () => {
        message.info("开始执行取消，请稍后")
        cancelBatchJob.mutate(undefined, {
            onSuccess: ({ batch_job }) => {
                console.log(batch_job)
            }
        })
        //更新process状态
        let path = `/admin/custom/product`
        let payload = {
            action : "cancelBatchJobProcess",
            job_id : batchJobId
        }
        const res = await medusaRequest("POST", path, payload)
        console.log("CancelBatchJob",res)

        
    }

    return (
        <div>
            {/* Other components */}
            <Button onClick={handleCancel}>取消</Button>
            {/* Other components */}
        </div>
    )
}

export default CancelBatchJob