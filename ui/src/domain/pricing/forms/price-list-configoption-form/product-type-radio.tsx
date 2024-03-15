import React, { useState } from 'react';
import type { RadioChangeEvent } from 'antd';
import { Radio } from 'antd';

type ProductTypeProps = {
    defaultProductType: string;
    setProductType: (productType: string) => void;
}

const ProductTypeRadio: React.FC<ProductTypeProps> = ({defaultProductType,setProductType}) => {
  const [value, setValue] = useState(1);

  const onChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
    setProductType(e.target.value);
  };

  return (
    <Radio.Group onChange={onChange} value={defaultProductType} >
      <Radio value="product">产品</Radio>
      <Radio value="product_bundle" >产品套餐</Radio>
    </Radio.Group>
  );
};

export default ProductTypeRadio;