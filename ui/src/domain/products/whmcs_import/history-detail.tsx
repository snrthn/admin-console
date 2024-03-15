import { useNavigate, useParams } from "react-router-dom"
import BackButton from "../../../components/atoms/back-button"
import { Button, Space, Table, TableProps } from "antd";
import { useEffect, useState } from "react";
import { TableParams } from "../../../hooks/custom/use-customer-info";
import { useAdminBatchJob, useAdminBatchJobs, useAdminUser, useAdminUsers } from "medusa-react";
import { BatchJob } from "@medusajs/medusa";
import medusaRequest from "../../../services/request";
import Spinner from "../../../components/atoms/spinner"
import User from "./user";
import { CSVLink, CSVDownload } from "react-csv";

const WhmcsImportHistoryDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState<any[]>();

    const { batch_job, isLoading } = useAdminBatchJob(id || "")
    console.log("batch_job",batch_job)
    
    const [csvData, setCsvData] = useState<any[]>();

    useEffect(() => {
        getJobProcess();
    }, []);

    //获取job数据
    const getJobProcess = async () =>{
        let path = `/admin/custom/product`
        let payload = {
            action : "getjobprocess",
            job_id: id,
        }
        const {data} = await medusaRequest("POST", path, payload)
        //return { ...data }
        console.log(data.result)
        setData(data.result);
        setCsvData(data.result);
    }

    const [tableParams, setTableParams] = useState<TableParams>({
        pagination: {
          current: 1,
          pageSize: 10,
        },
    });
    const onTableChange: TableProps<any>['onChange'] = (pagination, filters, sorter, extra) => {
        console.log('params', pagination, filters, sorter, extra);
        setTableParams({
          pagination,
          filters,
          ...sorter,
        });
    
        // `dataSource` is useless since `pageSize` changed
        if (pagination.pageSize !== tableParams.pagination?.pageSize) {
          setData([]);
        }
    };

    if (isLoading || !batch_job) {
        return (
          <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
            <Spinner variant="secondary" />
          </div>
        )
    }

      
    
    const columns: TableProps<any>['columns'] = [
        {
            title: 'Product Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Group Name',
            dataIndex: 'gid',
            key: 'gid',
        },
        
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Pay Type',
            key: 'paytype',
            dataIndex: 'paytype',
        },
    
    ];

    return (
        <div className="pb-5xlarge">
        <BackButton
            path="/a/products/whmcs_import_history"
            label="Back to Import History" 
            className="mb-xsmall"
        />
        <div className="gap-y-xsmall flex flex-col">
            <div className="gap-x-base grid grid-cols-12">
            <div className="gap-y-xsmall col-span-12 flex flex-col">
                <h2>导入记录详情</h2>
                <Space size="middle">
                    <Space.Compact>ID:{id}</Space.Compact>
                    <Space.Compact>日期时间:{batch_job.created_at ? batch_job.created_at.toString() : ""}</Space.Compact>
                    <Space.Compact>Operator:
                        <User userId={batch_job.created_by ?? ""} />
                    </Space.Compact>
                </Space>
                
            <Table 
              rowKey = {(record) => record.pid}
              columns={columns} 
              dataSource={data} 
              pagination={tableParams.pagination}
              onChange={onTableChange} 
            />  

            </div>
            </div>
            
            <CSVLink data={csvData||[]}><Button>下载数据</Button></CSVLink>
        </div>
        </div>
    )
}

export default WhmcsImportHistoryDetail