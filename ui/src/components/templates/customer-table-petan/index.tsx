import React, { Key, useEffect, useState, useRef } from 'react';
import { Button, Checkbox, Dropdown, MenuProps, Modal, Space, Table, Tag, Radio, Popconfirm, Select, message, Empty } from 'antd';
import type { GetProp, TableProps } from 'antd';
import { DownOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { useCustomerColumns } from '../customer-table/use-customer-columns';
import { useCustomerFilters } from '../customer-table/use-customer-filters';
import { useAdminCustomersTemp } from '../../../hooks/custom/use-custom-admin-customers';
import {  useNavigate } from 'react-router-dom';
import Input, { SearchProps } from 'antd/es/input';
import moment from 'moment';
import { TableParams, addGroup, addTag, changeStatus, customersList, queryCustomerInfoType, useCustomerInfo, createNewTag } from '../../../hooks/custom/use-customer-info';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import { t } from "i18next";


const CustomerTablePetan = () => {
  // 定义路由的快捷跳转的 Hooks
  const navigate = useNavigate()

  // 页面显示条数
  const DEFAULT_PAGE_SIZE = 15

  // 默认请求参数
  const defaultQueryProps = {
    expand: "orders",
  }

  // 取出过滤 Hooks 参数
  const {
    reset,
    paginate,
    setQuery: setFreeText,
    queryObject,
    representationObject,
  } = useCustomerFilters(location.search, defaultQueryProps)

  // 页面请求参数
  const offs = parseInt(queryObject.offset) || 0
  const lim = parseInt(queryObject.limit) || DEFAULT_PAGE_SIZE

  // const { customers, isLoading, count }  = useAdminCustomersTemp(
  //   {
  //     ...queryObject,
  //   },
  //   {
  //     keepPreviousData: true,
  //   }
  // )
  
  // 获取组和标签数据
  const { groups, tags } = useCustomerInfo(
    {
      action:"taggroup",
    },
    {
      keepPreviousData: true,
    }
  )

  // checkout 选项
  // 取出plainOptions中的groups 的name 生成数组
  type GroupOption = { name: string; id: string };
  const ckOptionGroups = groups?.map((group:GroupOption) => ({label: group.name, value: group.id}))
  
  // 取出plainOptions中的tags 的value 生成数组
  type TagOption = { value: string; id: string };
  const ckOptionTags =  tags?.map((tag:TagOption) => ({label: tag.value, value: tag.id}))
  console.log(ckOptionGroups,ckOptionTags)

  // 组的表格下拉数据
  const filterOptionGroups = groups?.map((group: {name: any}) => ({
    text: group.name,
    value: group.name
  }));

  // 标签的表格下拉数据
  const filterOptionTags = tags?.map((tag: { value: any }) => ({
    text: tag.value,
    value: tag.value
  }));

  type Id = string | number;

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

  // 搜索框组件
  const { Search } = Input;

  // 定义客户表格列头信息
  const [tagsFilter, setTagsFilter] = useState([]);
  const [newTag, setNewTag] = useState('');
  const newTagPlh = t('customers-table-tag-placeholder');
  const addNewTag = t('customers-table-add-tag');
  const columns: TableProps<DataType>['columns'] = [
    {
      title: t('customers-table-name'),
      dataIndex: 'last_name',
      key: 'name',
      render: (_, record) => <a onClick = {() => navigate(record.id)}>{record.first_name} {record.last_name}</a>,
    },
    {
      title: t('customers-table-email'),
      dataIndex: 'email',
      key: 'e',
    },
    {
      title: t('customers-table-status'),
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: t('customers-table-orders'),
      key: 'orders',
      dataIndex: 'orders',
      render: (_, { orders }) => (
        <>
          <div>{orders?.length || 0}</div>
        </>
      ),
    },
    {
      title: t('customers-table-tags'),
      key: 'tags',
      dataIndex: 'tags',
      render: (_, { tags }) => (
        <>
          {tags.map((tag) => {
            let _tag = tag.value;
            let color = _tag.length > 5 ? 'geekblue' : 'green';
            if (_tag === 'loser') {
              color = 'volcano';
            }
            return (
              <Tag color={color} key={_tag}>
                {_tag.toUpperCase()}
              </Tag>
            );
          })}
          {/* <div>{tags.map(tag => tag.value).join(', ')}</div> */}
        </>
      ),
      // filters: filterOptionTags,
      // onFilter: (value: string, record) => {
      //   return record.tags.map(tag => tag.value).includes(value)
      // },
      filterDropdown: ({ close }) => {
        return <div style={{ padding: '6px' }}>
          
          <div style={{ padding: '4px 12px' }}>
            {tags?.length ? <Checkbox.Group value={tagsFilter} onChange={changeTagHandle}>
              {
                tags?.map((child, childIndex) => {
                  return <div style={{ margin: '2px 0px', width: '100%' }}>
                    <Checkbox key={childIndex} value={child.name}>{child.name}</Checkbox>
                  </div>
                })
              }
            </Checkbox.Group> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }
          </div>

          <div style={{ padding: '8px' }}>
            <Search style={{ width: '140px' }} placeholder={newTagPlh} value={newTag} enterButton={addNewTag} size="small" onInput={(e) => inputTagsHandle(e)} onSearch={(e) => addTagsHandle(e)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0px 8px' }}>
            <Button type="link" size="small" disabled={!tagsFilter.length && !newTag} onClick={resetTagsHandle}>{t('customers-table-filter-reset')}</Button>
            <Button type="primary" size="small" onClick={() => queryByTagHandle(close)}>{t('customers-table-filter-ok')}</Button>
          </div>
          
        </div>;
      }
    },
    {
      title: t('customers-table-groups'),
      key: 'groups',
      dataIndex: 'groups',
      render: (_, { groups }) => (
        <>
          {groups.map(group => group.name).join(', ')}
        </>
      ),
      filters: filterOptionGroups,
      onFilter: (value: string, record) => {
        return record.groups.map(group => group.name).includes(value)
      },
    },
    {
      title: t('customers-table-last-login-date'),
      key: 'created_at',
      dataIndex: 'created_at',
      render: (created_at) => moment(created_at).format("DD MMM YYYY"),
    },
    {
      title: t('customers-table-reg-date'),
      key: 'created_at',
      dataIndex: 'created_at',
      render: (created_at) => moment(created_at).format("DD MMM YYYY"),
    },
    {
      title: t('customers-table-action'),
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick = {() => navigate(record.id)}>{t("customers-operation-modify")}</a>
          <a onClick = {() => navigate(record.id)}>{t("customers-table-detail")}</a>
        </Space>
      ),
    },
  ];

  // 改变标签
  const changeTagHandle = (tags: any) => {
    setTagsFilter(tags);
  }

  // 输入标签
  const inputTagsHandle = (e) => {
    setNewTag(e.target.value);
  }

  // 添加标签
  const addTagsHandle = async (e) => {
    console.log(newTag);
    let data = await createNewTag(
      {
        value: newTag
      },
      {}
    )
    setNewTag('');
  }

  // 重置筛选
  const resetTagsHandle = () => {
    setNewTag('');
    setTagsFilter([]);
  }

  // 查询筛选
  const queryByTagHandle = (close: any) => {
    close();
    fetchData({ tag: tagsFilter });
  }
  
  // const data: DataType[] = [
  //   {
  //     key: '1',
  //     name: 'John Brown',
  //     age: 32,
  //     address: 'New York No. 1 Lake Park',
  //     tags: ['nice', 'developer'],
  //   },
  //   {
  //     key: '2',
  //     name: 'Jim Green',
  //     age: 42,
  //     address: 'London No. 1 Lake Park',
  //     tags: ['loser'],
  //   },
  //   {
  //     key: '3',
  //     name: 'Joe Black',
  //     age: 32,
  //     address: 'Sydney No. 1 Lake Park',
  //     tags: ['cool', 'teacher'],
  //   },
  // ];

  // 更多操作弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 定义弹窗的类型
  const [isMoreActronModaltype, setMoreActronModalType] = useState("");

  // 显示选择到组弹窗
  const showMoreActronModal = (type:string) => {
    setIsModalOpen(true);
    setMoreActronModalType(type);
  };

  // 将组 或 标签关联到客户
  const handleOk = () => {
    setIsModalOpen(false);
    if(isMoreActronModaltype === t('customers-table-groups')){
      console.log("选中的组",selectedGroupKeys)
      //request api
      const ids = selectedRowKeys.join(",")
      const gids = selectedGroupKeys.join(",")
      addGroup(
        {
          groupid: gids,
          customerid: ids 
        },
        {}
      ).then(({code:changeCode,message:changeMag}) => {
        messageApi.info(changeCode+":"+changeMag);
      });

      onSelectGroupChange([]);
    }
    if(isMoreActronModaltype === t('customers-table-tags')){
      console.log("选中的标签",selectedTagKeys)
      // request api
      const ids = selectedRowKeys.join(",")
      const tids = selectedTagKeys.join(",")
      addTag(
        {
          tagid: tids,
          customerid: ids 
        },
        {}
      ).then(({code:changeCode,message:changeMag}) => {
        messageApi.info(changeCode+":"+changeMag);
      });
      onSelectTagChange([]);
    }
    fetchData();
  };

  // 取消关闭弹窗
  const handleCancel = () => {
    setIsModalOpen(false);
    setMoreActronModalType("");
  };

  // 客户列表选择集合
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 监听表格选择事件
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
    // setIsModalOpen(true);
  };

  // 选择表格一行
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // 选中的组集合
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<CheckboxValueType[]>([]);

  // 选择一个组
  const onSelectGroupChange: GetProp<typeof Checkbox.Group, 'onChange'> = (checkedValues) => {
    console.log('checked = ', checkedValues);
    setSelectedGroupKeys(checkedValues);
  };

  // 选中的标签集合
  const [selectedTagKeys, setSelectedTagKeys] = useState<CheckboxValueType[]>([]);

  // 选择一个标签
  const onSelectTagChange: GetProp<typeof Checkbox.Group, 'onChange'> = (checkedValues) => {
    console.log('checked = ', checkedValues);
    setSelectedTagKeys(checkedValues);
  };
  
  // 更多操作弹窗菜单
  const items: MenuProps['items'] = [
    {
      label: t("customers-operation-addgroup"),
      key: '1',
      icon: <UserOutlined />,
      onClick:()=>showMoreActronModal(t('customers-table-groups')),
    },
    {
      label: t("customers-add-tags"),
      key: '2',
      icon: <UserOutlined />,
      onClick:()=>showMoreActronModal(t('customers-table-tags')),
    },
  ];

  // 下拉菜单
  const menuProps = {
    items,
    // onClick: handleMenuClick,
  };

  // 提示信息
  const [messageApi, contextHolder] = message.useMessage();

  // 启用禁用数组 函数
  const changeUserStatus = (param:string) => {
    // 获取选中的用户id 转为字符串
    // console.log("选中的用户id",selectedRowKeys)
    const ids = selectedRowKeys.join(",")
    // const {code:changeCode,message:changeMag} = 
    changeStatus(
      {
        id:ids,
        status:param
      },
      {}
    ).then(({code:changeCode,message:changeMag}) => {
      fetchData();
      messageApi.info(changeCode+":"+changeMag);
    });
    // console.log(changeCode,changeMag)    
  };

  // 表格相关
  // type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;
  // interface TableParams {
  //   pagination?: TablePaginationConfig;
  //   sortField?: string;
  //   sortOrder?: string;
  //   filters?: Parameters<GetProp<TableProps, 'onChange'>>[1];
  // }

  // 表格数据
  const [data, setData] = useState<DataType[]>();

  // 页面Loading
  const [loading, setLoading] = useState(false);

  // 页码参数
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  // 获取 URL 参数
  const getRandomuserParams = () => {
    let offset = ((tableParams.pagination?.current || 1) - 1) * (tableParams.pagination?.pageSize || 10);
    return {
      offset: offset,
      limit: tableParams.pagination?.pageSize || 10,
      q: tableParams.search || undefined,
      expand: "tags,groups,orders,customer_fingerprint",
      ...filterParams
    };
  };

  // 从服务器取回用户数据
  const fetchData = (data?: Object) => {
    setLoading(true);
    customersList(
      {
        ...getRandomuserParams(),
        ...data
      },
      {}
    ).then(({customers,count}) => {
      console.log("data",customers,count)
      setData(customers);
      setLoading(false);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: count,
        },
      });
    });
  };

  // 监听 tableParams 变化
  useEffect(() => {
    fetchData();
    updateFilterData();
  }, [JSON.stringify(tableParams)]);

  // 监听表格内容变化
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

  // 搜索框相关
  let placeHolder = t('customers-input-searchkey');
  const onSearch: SearchProps['onSearch'] = (value, _e, info) => {
    console.log(info?.source, value);
    setTableParams({
      ...tableParams,
      search: value,
    });
    //fetchData();
  };

  // 过滤条件数据保存
  const [filterList, setFilterList] = useState([])

  // 过滤条件面板渲染数据
  const [filterPanelList, setFilterPanelList] = useState([
    {
      key: 'email',
      label: t('customers-table-email'),
      checked: false,
      type: 'input',
      value: ''
    },
    {
      key: 'status',
      label: t('customers-table-status'),
      checked: false,
      type: 'checkbox',
      value: [],
      children: [
        { label: t('customers-filter-status-active'), value: 'active' },
        { label: t('customers-filter-status-closed'), value: 'closed' }
      ]
    },
    {
      key: 'groups',
      label: t('customers-table-groups'),
      checked: false,
      type: 'checkbox',
      value: [],
      children: []
    },
    {
      key: 'tags',
      label: t('customers-table-tags'),
      checked: false,
      type: 'select',
      value: [],
      options: []
    }
  ])

  // 数据请求组合参数
  const [filterParams, setFilterParams] = useState({});

  // 过滤条件当前选择
  const [curFilVal, setCurFilVal] = useState('');
  // 过滤条件别名
  const [searchKey, setSearchKey] = useState('');
  // 显示过滤条件框
  const [showConModal, setMshowConModal] = useState(false);

  // 选择或清除过滤条件
  const changeFilItemHandle = (e: any, item: any) => {
    item.checked = e.target.checked;
    if (!item.checked) {
      if (item.type === 'input') {
        item.value = '';
      } else if (item.type === 'checkbox') {
        item.value = [];
      } else if (item.type === 'select') {
        item.value = [];
      }
    }
    setFilterPanelList([...filterPanelList])
  }

  // 显示过滤条件Modal
  const showModalHandle = () => {
    setMshowConModal(true);
  }

  // 输入文本
  const changeIptHandle = (e, item) => {
    item.value = e.target.value;
    setFilterPanelList([...filterPanelList])
  }

  // 选择复选框
  const changeBoxHandle = (e, item) => {
    item.value = e;
    setFilterPanelList([...filterPanelList])
  }

  // 改变下拉
  const changeSelHandle = (e, item) => {
    item.value = e;
    setFilterPanelList([...filterPanelList])
  }

  // 更新过滤条件
  const updateFilterData = () => {
    filterPanelList.forEach((item: any) => {
      if (item.key === 'groups') {
        item.children = (groups || []).map((group: any) => {
          return { label: group.name, value: group.id };
        })
      } else if (item.key === 'tags') {
        item.options = (tags || []).map((tag: any) => {
          return { label: tag.name, value: tag.id };
        })
      }
    })
    setFilterPanelList([ ...filterPanelList ]);
    console.log('更新过滤条件', filterOptionGroups, filterOptionTags);
  }

  // 重置过滤条件面板
  const resetFilterHandle = () => {
    filterPanelList.forEach((item: any) => {
      item.checked = false;
      if (item.type === 'input') {
        item.value = '';
      } else if (item.type === 'checkbox') {
        item.value = []
        item.children.forEach((child: any) => {
          child.checked = false;
        })
      } else if (item.type === 'select') {
        item.value = [];
      }
    })
    setFilterPanelList([...filterPanelList]);
    console.log('重置了')
  }

  // 输入过滤条件别名
  const changeSearchKey = (e) => {
    setSearchKey(e.target.value);
  }

  // 保存过滤条件
  const saveFilterHandle = (e) => {
    if (!searchKey) return;
    filterList.push({
      label: searchKey,
      data: collectFilterData()
    })
    setFilterList([...filterList])

    setSearchKey('');
  }

  // 收集过滤数据
  const collectFilterData = () => {
    let filterObj = {};
    filterPanelList.forEach((item) => {
      if (typeof item.value === 'string') {
        if (item.value) filterObj[item.key] = item.value;
      } else {
        if (item.value.length > 0) {
          filterObj[item.key] = item.value;
        }
      }
    })
    return filterObj;
  }

  // 应用过滤条件
  const confirmFilterHandle = () => {
    setMshowConModal(false);
    let data = collectFilterData();
    console.log(data);

    fetchData(data);
  }

  // 切换查询条件
  const switchFilterType = (filterObj) => {
    setCurFilVal(filterObj.label)
    console.log(filterObj.data);

    fetchData(filterObj.data);
  }

  // 清除当前保存条件
  const clearTagHandle = (e, index) => {
    e.preventDefault()
    if (filterList[index].label === curFilVal) {
      setCurFilVal('');
    }
    filterList.splice(index, 1);
    setFilterList([...filterList]);
  }

  const filterInputPlaceHolder = t("customers-filter-input-placeholder");
  const filterSelectPlaceHolder = t("customers-filter-select-placeholder");

  // 页面结构部分
  return (
    <>
    {/* 将用户添加到组模态框 */}
    <Modal title={t("customers-please-select")+isMoreActronModaltype} open={isModalOpen} okText={t('transfer-orders-modal-confirm')} cancelText={t('transfer-orders-modal-cancel')} onOk={handleOk} onCancel={handleCancel}>
      <div>
        {isMoreActronModaltype === t('customers-table-groups') ? (
          <Checkbox.Group options={ckOptionGroups} value={selectedGroupKeys} onChange={onSelectGroupChange}/>
        ) : (
          <Checkbox.Group options={ckOptionTags}  value={selectedTagKeys} onChange={onSelectTagChange}/>
        )}
      </div>
    </Modal>

    {/* 过滤条件 */}
    <Space style={{ marginBottom: 6 }}>
      <Popconfirm
        placement="bottomLeft"
        title=""
        icon=""
        open={showConModal}
        description={ () => (
          <div style={{ width: '260px', minHeight: '50px' }}>

            {
              filterPanelList.map((item, index) => {
                return <div key={index} style={{  borderBottom: '1px solid #f0f0f0', paddingBottom: '3px', marginBottom: '3px' }}>
                  <Checkbox style={{ margin: '4px 0px 8px' }} checked={item.checked} onChange={(e) => changeFilItemHandle(e, item)}>
                    {item.label}
                  </Checkbox>
                  {
                    item.checked && (<div style={{ marginBottom: 4 }}>

                      {item.type === 'input' && <div style={{ marginLeft: '1em' }}>
                        <Input placeholder={filterInputPlaceHolder} style={{ width: '100%' }} value={item.value} onChange={(e) => changeIptHandle(e, item)} />
                      </div>}

                      {item.type === 'checkbox' && <div style={{ margin: '3px 2px 3px 1em' }}>
                          <Checkbox.Group value={item.value} onChange={(e) => changeBoxHandle(e, item)}>
                            {
                              item.children.map((child, childIndex) => {
                                return <div style={{ margin: '2px 0px', width: '100%' }}>
                                  <Checkbox key={childIndex} value={child.value}>{child.label}</Checkbox>
                                </div>
                              })
                            }
                          </Checkbox.Group>
                      </div>}

                      {item.type === 'select' && <div style={{ marginLeft: '1em' }}>
                        <Select placeholder={filterSelectPlaceHolder} style={{ width: '100%' }} mode="tags" options={item.options} tokenSeparators={[',']} value={item.value} onChange={(e) => changeSelHandle(e, item)}></Select>
                      </div>}                       

                    </div>)
                  }
                </div>
              })
            }

            <Space.Compact style={{ width: '100%' }}>
              <Input size="middle" value={searchKey} onChange={changeSearchKey} placeholder={filterInputPlaceHolder} />
              <Button size="middle" type="primary" onClick={saveFilterHandle}>{t('customers-filter-dropdown-save')}</Button>
            </Space.Compact>
            
          </div>
        )}
        okText={t('customers-filter-dropdown-apply')}
        cancelText={t('customers-filter-dropdown-reset')}
        onCancel={resetFilterHandle}
        onConfirm={confirmFilterHandle}
      >
      <Button type="primary" style={{ display: 'flex', alignItems: 'center' }} onClick={showModalHandle}>
        <span>{ t('customers-filter-dropdown-filters') } { filterList.length }</span>
        <PlusOutlined />
      </Button>
      </Popconfirm>

      {
        filterList.map((item, index) => {
          return <Tag style={{ cursor: 'pointer' }} bordered={false} closable color={ item.label === curFilVal ? 'red' : '' } onClick={(e) => switchFilterType(item, item.label)} onClose={(e) => clearTagHandle(e, index)} >{ item.label }</Tag>
        })
      }
    </Space>

    {/* 操作栏 */}
    <Space wrap  style={{ marginBottom: 16 }}>
      <Button type="primary" onClick={() => changeUserStatus("active")}>
        {t("customers-operation-enabled")}
      </Button>
      <Button danger  onClick={() => changeUserStatus("closed")}>
        {t("customers-operation-disabled")}
      </Button>
      <Dropdown menu={menuProps}>
        <Button>
          <Space>
            {t("customers-more-operation")}
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
      <Search placeholder={ placeHolder } onSearch={onSearch} allowClear style={{ float: 'right' }} />
    </Space>

    {/* 表格区 */}
    <Table 
      rowSelection={rowSelection} 
      rowKey = {(record) => record.id}
      columns={columns} 
      dataSource={data} 
      pagination={tableParams.pagination}
      onChange={onTableChange} 
    >
    </Table>
  </>    
  )
}

export default CustomerTablePetan;