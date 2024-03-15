import { Input, Space, Table, TableProps } from "antd";
import { useCallback, useEffect, useState } from "react";
import medusaRequest from "../../../../services/request";
import { Product } from "@medusajs/medusa";
import { Option,ConfigOption, WhmcsProduct } from "./configoption"


type SubPriceProps = {
    product: Product,
    configoption: ConfigOption | null,
    setOptionSubPrice:(configoption:Option[] | null) => void,
    modifiedPrice:Option[] | null,
}


const ConfigOptionSubPrice : React.FC<SubPriceProps>  = ( {product,configoption,setOptionSubPrice,modifiedPrice}) => {
    const loading =  false;
    const error =  false;

    const [tableData, setTableData] = useState<Option[]>();

    const [editData,setEditData] = useState<Option[]>(); //修改项

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
          setTableData([]);
        }
    };

    
    useEffect(() => {
        if (configoption == null) return;
        const data = configoption.options.option;
        //遍历data，更新pricing
        if (modifiedPrice) {
            let newData = [...data || []]
            modifiedPrice.forEach((item) => {
                const idx = newData.findIndex(dataItem => dataItem.id === item.id)
                if (idx !== -1) {
                    newData[idx] = item;
                }
            })
            setTableData(newData);
        }else{
            setTableData(data);
        }
        console.log("configoption.options", configoption.options.option);
    }, [configoption]);

    // In your component's return statement
    if (configoption == null) {
        return <p>Loading...</p>;
    }

    // Rest of your component's rendering logic
    

    if (loading) return <p>Loading...</p>;
    
    if (error) return <p>Error: </p>;



    type EditableInputProps = {
        text:string,
        currency: string,//币种
        cycle:string,//周期
        record:Option,
        // tableData:Option[],
        // setTableData:(tableData:Option[]) => void,
    }

    
    const EditableInput = ({ text, currency,cycle, record}:EditableInputProps) => {
    const onValueChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;
        let newData = [...tableData || []]
        const idx = newData.findIndex(item => item.id === record.id)
        if (idx !== -1) {
            newData[idx] = {
                ...newData[idx],
                pricing:{
                    ...newData[idx].pricing,
                    [currency]:{
                        ...newData[idx].pricing[currency],
                        [cycle]:value
                    }
                }
            }
            setTableData(newData)


            //记录修改项
            let newEditData = [...editData || []];
            //判断是否已经存在
            const editIdx = newEditData.findIndex(item => item.id === record.id)
            if (editIdx !== -1) {
                newEditData[editIdx] = newData[idx]
            }else{
                newEditData.push(newData[idx]);
            }
            setEditData(newEditData);
            setOptionSubPrice(newEditData);
            console.log("onValueChange",value,newEditData)
        }
       
    }, [tableData,record]);
    
    return (
        <>
        <Input
            value={text}
            onChange={onValueChange}
        />
        </>
    )
    }

    


    const columns: TableProps<any>['columns'] = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Option Name',
            dataIndex: 'rawName',
            key: 'name',
        },
        // {
        //     title: 'CNY',
        //     children: [
        //       {
        //         title: 'monthly',
        //         dataIndex: ['pricing','CNY','monthly'],
        //         key: 'CNY.monthly',
        //         render: (text, record) => (
        //           <EditableInput text={text} currency="CNY" cycle="monthly" record={record} />
        //         ),
        //       },
        //     ]
        // },
        

    ];

    const currency = ["CNY","USD"];
    const cycle = ["monthly","quarterly","semiannually","annually","biennially","triennially"];
    currency.forEach((item) => {
        const columnsItem = {
            title: item,
            children: [] as TableProps<any>['columns'] || [],
        };

        cycle.forEach((cycleItem) => {
            columnsItem.children.push({
                title: cycleItem,
                dataIndex: ['pricing', item, cycleItem],
                key: `${item}.${cycleItem}`,
                render: (text, record) => (
                    <EditableInput text={text} currency={item} cycle={cycleItem} record={record} />
                ),
            });
        });

        columns.push(columnsItem); // Add this line to add columnsItem to the columns array
    })




  return (
    <div>
        设置 {configoption.name} 子项价格
        <Table 
              rowKey = {(record) => record.id}
              columns={columns} 
              bordered
              dataSource={tableData} 
              pagination={tableParams.pagination}
              onChange={onTableChange} 
            />   
    </div>
  );
};

export default ConfigOptionSubPrice