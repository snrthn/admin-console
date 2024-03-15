import { useNavigate } from "react-router-dom"
import BackButton from "../../../components/atoms/back-button"
import { Space, Table, TableProps } from "antd";
import { useState } from "react";
import { TableParams } from "../../../hooks/custom/use-customer-info";
import { useAdminBatchJobs, useAdminUsers } from "medusa-react";
import { BatchJob } from "@medusajs/medusa";


const WhmcsImportHistory = () => {
    const navigate = useNavigate()
    const [data, setData] = useState<BatchJob[]>();

    const {
        batch_jobs,
        limit,
        offset,
        count,
        isLoading
      } = useAdminBatchJobs(
        {
            type:["import-whmcs-product"],
            limit: 100,
            offset: 0,
        }
      )
    console.log(batch_jobs)
    // setData(batch_jobs);

    const { users } = useAdminUsers()
    console.log(users)


    const columns: TableProps<BatchJob>['columns'] = [
        {
            title: 'Job ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Datetime',
            dataIndex: 'created_at',
            key: 'created_at',
        },
        {
            title: 'Products',
            dataIndex: 'result',
            key: 'result',
            render: (result) => {
                if (!result) {
                    return "Unknown";
                }
                return result.count;
            },
        },
        
        {
            title: 'Job Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Operator',
            key: 'created_by',
            dataIndex: 'created_by',
            render: (created_by) => {
                if (!users || users.length === 0) {
                    console.error('No users available');
                    return "Unknown";
                }
                const user = users.find((user) => user.id === created_by);
                // return user ? `${user.first_name} ${user.last_name}` : "Unknown";
                return user ? `${user.email}` : "Unknown";
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
              <Space size="middle">
                <a onClick = {() => navigate(record.id)}>详情</a>
                <a onClick = {() => navigate(record.id)}>下载</a>
              </Space>
            ),
        },
    
    ];

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

    return (
        <div className="pb-5xlarge">
        <BackButton
            path="/a/products/whmcs_import"
            label="Back to Import"
            className="mb-xsmall"
        />
        <div className="gap-y-xsmall flex flex-col">
            <div className="gap-x-base grid grid-cols-12">
            <div className="gap-y-xsmall col-span-12 flex flex-col">
            <Table 
              rowKey = {(record) => record.id}
              columns={columns} 
              dataSource={batch_jobs} 
              pagination={tableParams.pagination}
              onChange={onTableChange} 
            />  

            </div>
            </div>
        </div>
        </div>
    )
}

export default WhmcsImportHistory