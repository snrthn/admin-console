import { useAdminBatchJobs, useAdminCancelBatchJob, useAdminCreateBatchJob, useAdminProduct } from "medusa-react"
import { useNavigate, useParams } from "react-router-dom"
import BackButton from "../../../components/atoms/back-button"
import Spinner from "../../../components/atoms/spinner"
import WidgetContainer from "../../../components/extensions/widget-container"
import ProductAttributesSection from "../../../components/organisms/product-attributes-section"
import ProductGeneralSection from "../../../components/organisms/product-general-section"
import ProductMediaSection from "../../../components/organisms/product-media-section"
import ProductRawSection from "../../../components/organisms/product-raw-section"
import ProductThumbnailSection from "../../../components/organisms/product-thumbnail-section"
import ProductVariantsSection from "../../../components/organisms/product-variants-section"
import { useWidgets } from "../../../providers/widget-provider"
import { getErrorStatus } from "../../../utils/get-error-status"
import { Alert, Button, Checkbox, Col, GetProp, Input, MenuProps, Modal, Row, Space, Table, TableProps, message } from "antd"
import { ChangeEvent, SetStateAction, useEffect, useState } from "react"
import { set } from "react-hook-form"
import { TableParams, addGroup, addTag, changeStatus, customersList, useCustomerInfo } from "../../../hooks/custom/use-customer-info"
import moment from "moment"
import { SearchProps } from "antd/es/input"
import { CheckboxValueType } from "antd/es/checkbox/Group"
import { useCustomerFilters } from "../../../components/templates/customer-table/use-customer-filters"
import medusaRequest from "../../../services/request"
import BatchJob from "./cancel"
import ProcessNotice from "./notifcation"
import ProcessNoticeBtn from "./notifcation"
import CancelBatchJob from "./cancel"

const WhmcsImport = () => {

  const createBatchJob = useAdminCreateBatchJob()

  const [batchJobId, setBatchJobId] = useState("");
  const [batchJobProcess, setbatchJobProcess] = useState(0);
  const [isProcess, setIsProcess] = useState(false);

  const navigate = useNavigate()

  //获取最新job数据
  const {
    batch_jobs,
  } = useAdminBatchJobs(
    {
        type:["import-whmcs-product"],
        limit: 1,
        offset: 0,
    }
  )
  console.log("batch_jobs",batch_jobs)
  // if(batch_jobs){
  //   setBatchJobId(batch_jobs[0].id)
  // }
  useEffect(() => {
    console.log("batch_jobs",batch_jobs)
    if(batch_jobs && batch_jobs.length > 0){
      setBatchJobId(batch_jobs[0].id)
      if(batch_jobs[0].status === "confirmed" || batch_jobs[0].status === "created"){
        setIsProcess(true)
      }
    }
  }, [batch_jobs]);

  //获取相关job process数据
  const getJobProcess = async () =>{
    if(batchJobId === "") return
    let path = `/admin/custom/product`
    let payload = {
        action : "getjobprocess",
        job_id: batchJobId,
    }
    const {data} = await medusaRequest("POST", path, payload)
    
    if(data && data.progress && data.progress.advancement_count && data.progress.count){
      console.log(data.progress)
      setIsProcess(data.progress.count > data.progress.advancement_count ? true : false)
      //通过advancement_count和count计算百分比
      setbatchJobProcess(Math.floor(data.progress.advancement_count / data.progress.count * 100))
    }else{
      setbatchJobProcess(0)
    }

    if(data && data.job_status  && (data.job_status === "confirmed" || data.job_status === "created") ){
      setIsProcess(true)
    }else{
      setIsProcess(false)
    }
    

  }

  //定时获取job process数据
  useEffect(() => {
    const interval = setInterval(() => {
      getJobProcess();
    }, 3000);
    return () => clearInterval(interval);
  }, [batchJobId]);

  // const { product, status, error } = useAdminProduct(id || "")

  // if (error) {
  //   const errorStatus = getErrorStatus(error)

  //   if (errorStatus) {
  //     // If the product is not found, redirect to the 404 page
  //     if (errorStatus.status === 404) {
  //       navigate("/404")
  //       return null
  //     }
  //   }

  //   // Let the error boundary handle the error
  //   throw error
  // }

  // if (status === "loading" || !product) {
  //   return (
  //     <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
  //       <Spinner variant="secondary" />
  //     </div>
  //   )
  // }

  //选中导入
  const importWhmcsProduct = () => {
    console.log("importWhmcsProduct")
    console.log("选择项：",selectedRowKeys)
    //转成字符串 
    const _ids = selectedRowKeys.join(",")
  
    createBatchJob.mutate({
      type: "import-whmcs-product",
      context: {
        ids:_ids
      },
      dry_run: false
    }, {
      onSuccess: ({ batch_job }) => {
        console.log(batch_job)
        setBatchJobId(batch_job.id)
      }
    })
  }

  //导入全部
  const importAll = () => {
    console.log("导入全部")
    const _ids = data?.map((item) => item.id).join(",")
    // console.log("导入全部选择项：",_ids)
    createBatchJob.mutate({
      type: "import-whmcs-product",
      context: {
        ids:_ids
      },
      dry_run: false
    }, {
      onSuccess: ({ batch_job }) => {
        console.log(batch_job)
        setBatchJobId(batch_job.id)
      }
    })
  }

  // const [inputValue, setInputValue] = useState('');
  // const handleChange = (event: { target: { value: SetStateAction<string> } }) => {
  //   setInputValue(event.target.value);
  // };

  



  /**
   * 获取未导入产品数据
   */
  const getNotImpotProductList = async (
    body?:{
      product_name: string,
      group_name: string  
    },
  ) =>{
    let path = `/admin/custom/product`
    let payload = {
      action : "getwhmcsproduct",
      ...body
    }
    const {data} = await medusaRequest("POST", path, payload)
    return { ...data }
  }



  interface DataType {
    id: React.Key;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    tags: string[];
    groups: string[];
    orders: string[];
    created_at: string;
  }

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Product ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => <a onClick = {() => navigate(record.id)}>{record.name}</a>,
    },
    {
      title: 'Group Name',
      dataIndex: 'groupname',
      key: 'groupname',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (_, record) => <p>{record.type} ({record.servertype})</p>,
    },
    {
      title: 'Pay Type',
      key: 'paytype',
      dataIndex: 'paytype',
    },
    
  ];


  //customlist 多选框
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
    // setIsModalOpen(true);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };



  //表格相关
  // type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;
  // interface TableParams {
  //   pagination?: TablePaginationConfig;
  //   sortField?: string;
  //   sortOrder?: string;
  //   filters?: Parameters<GetProp<TableProps, 'onChange'>>[1];
  // }
  const [data, setData] = useState<DataType[]>();
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });
  
  const fetchData = () => {
    setLoading(true);
    getNotImpotProductList(

    ).then(({data}) => {
      console.log("data2",data)
      setData(data);
      setLoading(false);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: data?.length,
        },
      });
    });
  };

  useEffect(() => {
    fetchData();
  }, []);//[JSON.stringify(tableParams)]


  //
  const onTableChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter, extra) => {
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

//产品名称 input
const [inputPNValue, setInputPNValue] = useState('');
const handlePNChange = (event: { target: { value: SetStateAction<string> } }) => {
  setInputPNValue(event.target.value);
};

//产品组 input
const [inputPGValue, setInputPGValue] = useState('');
const handlePGChange = (event: { target: { value: SetStateAction<string> } }) => {
  setInputPGValue(event.target.value);
};

  

//查询
function searchBtn(): void {
  console.log("查询")
  console.log("产品名称",inputPNValue)
  console.log("产品组",inputPGValue)
  getNotImpotProductList(
    {
      product_name: inputPNValue,
      group_name: inputPGValue
    }
  ).then(({data}) => {
    console.log("data2",data)
    setData(data);
    setLoading(false);
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        total: data?.length,
      },
    });
  });
}

//重置
function resetBtn(): void {
  setInputPGValue('')
  setInputPNValue('')
}




//导入model
const [isModalOpen, setIsModalOpen] = useState(false);
const [importType, setimportType] = useState("select");

const showModal = (type:string) => {
  if(selectedRowKeys.length === 0 && type === "select"){
    message.error('请先选择产品');
    return
  }
  setimportType(type)
  setIsModalOpen(true);
};

const handleOk = () => {
  setIsModalOpen(false);
  setIsProcessModalOpen(true);
  // message.info(importType)

  setIsProcess(true);
  setbatchJobProcess(0);
  // importWhmcsProduct();
  if(importType === "select"){
    importWhmcsProduct();
  } else {  
    importAll();
  }
};

const handleCancel = () => {
  setIsModalOpen(false);
};
//导入进程model 
const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

const handleProcessOk = () => {
  setIsProcessModalOpen(false);
};

const handleProcessCancel = () => {
  setIsProcessModalOpen(false);
};

const backBatchJob = () => {
  setIsProcessModalOpen(false);
}

const _len = data?.length ?? 0
const alertMsg = `提示：WHMCS中尚有${_len}个产品尚未导入，是否立即导入？`;
const alertProcessMsg = `提示：正在导入 … ${batchJobProcess}%`;

  return (
    <div className="pb-5xlarge">
      <BackButton
        path="/a/products"
        label="Back to Products"
        className="mb-xsmall"
      />
      <div className="gap-y-xsmall flex flex-col">
      
        <div className="gap-x-base grid grid-cols-12">
          <div className="gap-y-xsmall col-span-12 flex flex-col">
          {!isProcess && _len > 0  && (<Space direction="vertical" style={{ width: '50%' }}>
            <Alert
              message={alertMsg}
              type="info" 
              showIcon
              closable
              action={
                <Button  type="text" size="small" onClick={()=>showModal("all")} >
                  立即导入
                </Button>
              }
            />
          </Space>)}
          
          {isProcess && (<Space direction="vertical" style={{ width: '30%' }}>
            <Alert
              message={alertProcessMsg}
              type="warning"
              action={
                <Space>
                  <CancelBatchJob batchJobId={batchJobId} />
                </Space>
              }
            />
          </Space>)}
            <Row>
              <Col span={5} >
                <Space>
                    产品名称：
                    <Input value={inputPNValue} 
                    onChange={handlePNChange}  />
                </Space>
              </Col>
              <Col span={5} >
                <Space>
                    产品组：
                    <Input value={inputPGValue} 
                    onChange={handlePGChange}  />
                </Space>
              </Col>
              <Col span={5} >
                <Space size="small">
                  <Button onClick={()=>searchBtn()}  disabled={isProcess}>查询</Button>
                  <Button onClick={()=>resetBtn()}  disabled={isProcess}>重置</Button>
                  <Button onClick={() => navigate("/a/products/whmcs_import_history")}>
                      历史纪录
                  </Button>
                </Space>
              </Col>
            </Row>
            <Table 
              rowSelection={rowSelection} 
              rowKey = {(record) => record.id}
              columns={columns} 
              dataSource={data} 
              pagination={tableParams.pagination}
              onChange={onTableChange} 
            />
            <div className="flex space-x-2">
              {/* <Input placeholder="528,547" onChange={onInputChange} />; */}

              <Button type="primary" onClick={()=>showModal("select")} disabled={isProcess}>
                导入选中的
              </Button>
              <Button type="primary" danger onClick={()=>showModal("all")}  disabled={isProcess}>
                导入全部
              </Button>

              <Modal 
                title="从 WHMCS 中导入产品数据" 
                open={isModalOpen} 
                onOk={handleOk} 
                onCancel={handleCancel}>
                <p>导入WHMCS 产品数据会覆盖现有电商系统的相应产品数据，是否继续？</p>
              </Modal>

              <Modal 
                title="正在导入" 
                open={isProcessModalOpen} 
                onOk={handleProcessOk} 
                onCancel={handleProcessCancel}
                footer={[
                  // <ProcessNoticeBtn  />,
                  <Button key="submit" type="primary" onClick={backBatchJob}>
                    后台运行
                  </Button>,
                  <CancelBatchJob batchJobId={batchJobId} />
                ]}>
                <p>{alertProcessMsg} </p>
                {/* <Space.Compact>
                  <Input value={inputValue} 
                  onChange={handleChange}  />
                </Space.Compact> */}
              </Modal>
              

              
              
              
              <Space direction="vertical" size="middle">
          
                
              </Space>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default WhmcsImport
