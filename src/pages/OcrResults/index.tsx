import { useEffect, useState } from 'react';
import { Table, Button, message, Space, Card, Typography, Image } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { getUserOcrResultsUsingGet, deleteOcrResultUsingDelete } from '@/services/ocr/ocr';
import type { OcrResult, OcrResultItem } from '@/services/ocr/typings';

const { Title, Text } = Typography;

const OcrResultsPage = () => {
  const [data, setData] = useState<OcrResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取用户OCR结果
  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await getUserOcrResultsUsingGet();
      if (response.code === 200) {
        setData(response.data || []);
      } else {
        message.error('获取结果失败');
      }
    } catch (error) {
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    fetchResults();
  }, []);

  // 删除结果
  const handleDelete = async (id: number) => {
    try {
      const response = await deleteOcrResultUsingDelete(id);
      if (response.code === 200 && response.data) {
        message.success('删除成功');
        // 重新获取数据
        fetchResults();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('网络错误');
    }
  };

  // 解析textResult为OcrResultItem数组
  const parseTextResult = (textResult: string): OcrResultItem[] => {
    try {
      return JSON.parse(textResult);
    } catch (error) {
      return [];
    }
  };

  // 渲染文本结果
  const renderTextResult = (textResult: string) => {
    const items = parseTextResult(textResult);
    return items.map((item, index) => (
      <div key={index}>
        <Text>文本：{item.ocrText?.text || ''}</Text>
        <Text style={{ marginLeft: '16px' }}>置信度：{item.ocrText?.score?.toFixed(4) || ''}</Text>
      </div>
    ));
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (imageUrl: string) => (
        <Image width={100} src={imageUrl} alt="OCR Image" />
      ),
    },
    {
      title: '识别结果',
      dataIndex: 'textResult',
      key: 'textResult',
      render: (textResult: string) => renderTextResult(textResult),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: OcrResult) => (
        <Space size="middle">
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id!)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={4}>OCR识别结果列表</Title>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchResults} 
            loading={loading}
          >
            刷新
          </Button>
        </div>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default OcrResultsPage;