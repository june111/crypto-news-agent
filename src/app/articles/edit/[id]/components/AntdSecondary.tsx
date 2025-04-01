// 次要Ant Design组件导出
// 这个文件将多个非关键UI组件合并到一个包中，减少编译时的模块数量

import Card from 'antd/lib/card';
import Upload from 'antd/lib/upload';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Tabs from 'antd/lib/tabs';
import Typography from 'antd/lib/typography';
import { UploadOutlined } from '@ant-design/icons';

// 将所有组件导出为一个单一对象
const AntdSecondary = {
  Card,
  Upload,
  Row,
  Col,
  Tabs,
  Typography,
  Icons: {
    UploadOutlined
  }
};

export default AntdSecondary; 