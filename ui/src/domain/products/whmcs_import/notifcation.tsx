import React from 'react';
import { Button, notification } from 'antd';

const key = 'updatable';

const ProcessNoticeBtn: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.open({
      key,
      message: '正在导入',
      description: '当前进度 0%',
    });

    setTimeout(() => {
      api.open({
        key,
        message: 'New Title',
        description: 'New description.',
      });
    }, 1000);
  };

  return (
    <>
      {contextHolder}
      <Button type="primary" onClick={openNotification}>
        后台运行
      </Button>
    </>
  );
};

export default ProcessNoticeBtn;