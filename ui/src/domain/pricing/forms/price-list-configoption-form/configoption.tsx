import { Space, Table, TableProps } from "antd";
import { useEffect, useState } from "react";
import medusaRequest from "../../../../services/request";
import { PriceList, Product } from "@medusajs/medusa";

export interface ConfigOption {
    id: number;
    name: string;
    type: string;
    options: {
        option: Option[];
    };
}

export interface Option {
    id: number;
    name: string;
    pricing: {
        [key: string]: {
            monthly: string;
            annually: string;
            asetupfee: string;
            bsetupfee: string;
            msetupfee: string;
            qsetupfee: string;
            quarterly: string;
            ssetupfee: string;
            tsetupfee: string;
            biennially: string;
            triennially: string;
            semiannually: string;
        };
    };
    rawName: string;
    required: string;
    recurring: null;
}

export interface WhmcsProduct {
    configoptions: {
        configoption: ConfigOption[];
    };
}

export type NewPriceList = PriceList & {
    metadata?:{
      configoption_price?: Option[] | null
    },
    product_type?:string
};

type BulkEditorProps = {
    product: Product
    setOptionSub:(product: Product | null, configoption:ConfigOption | null) => void
  }


const PriceListConfigOptionForm  = ( {product,setOptionSub}:BulkEditorProps) => {
    const loading =  false;
    const error =  false;

    const [data, setData] = useState<ConfigOption[]>();

    const [tableParams, setTableParams] = useState<any>({
        pagination: {
          current: 1,
          pageSize: 30,
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

    useEffect(() => {
        //读取product参数 中的configoption
        console.log(product.metadata?.whmcs);
        const whmcsProduct:WhmcsProduct = product.metadata?.whmcs as WhmcsProduct;
        const configoptionData: ConfigOption[] = whmcsProduct?.configoptions?.configoption;

        console.log(configoptionData); // This will log the configoption data if it exists

        //let data = product?.metadata?.whmcs?.configoptions?.configoption;
        setData(configoptionData);
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: </p>;


    


    const columns: TableProps<any>['columns'] = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Option Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Type',
            key: 'type',
            dataIndex: 'type',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
              <Space size="middle">
                <a onClick = {() => {
                    setOptionSub(product as Product,record as ConfigOption)
                  }}>编辑</a>
              </Space>
            ),
        },
        

    ];


  return (
    <div>
        <h1>{product.title} Config Option</h1>
        <Table 
              rowKey = {(record) => record.id}
              columns={columns} 
              dataSource={data} 
              pagination={tableParams.pagination}
              onChange={onTableChange} 
            />   
    </div>
  );
};

export default PriceListConfigOptionForm