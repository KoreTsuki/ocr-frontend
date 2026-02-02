import React, { useEffect, useState } from 'react';
import {
  Table, Button, message, Space, Card, Typography,
  Image, Drawer, List, Tag, Tooltip, Divider, Empty, Input
} from 'antd';
import {
  DeleteOutlined, ReloadOutlined, EyeOutlined,
  CopyOutlined, DownloadOutlined, FilePdfOutlined,
  FileImageOutlined, FileTextOutlined
} from '@ant-design/icons';
import { getUserOcrResultsUsingGet, deleteOcrResultUsingDelete } from '@/services/ocr/ocr';
import type { OcrResult } from '@/services/ocr/typings';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// JSON 格式的 Item 结构 (用于图片)
interface OcrItem {
  coordinates: { x: number; y: number }[];
  ocrText: {
    text: string;
    score: number;
  };
}

const OcrResultsPage = () => {
  const [data, setData] = useState<OcrResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OcrResult | null>(null);

  // 详情数据状态
  const [isPdf, setIsPdf] = useState(false);
  const [parsedItems, setParsedItems] = useState<OcrItem[]>([]); // 图片用的结构化数据
  const [rawText, setRawText] = useState<string>('');          // PDF用的纯文本数据

  // 判断是否为 PDF 文件
  const checkIsPdf = (url?: string) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf');
  };

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

  useEffect(() => {
    fetchResults();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteOcrResultUsingDelete(id);
      if (response.code === 200 && response.data) {
        message.success('删除成功');
        fetchResults();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('网络错误');
    }
  };

  // 打开详情
  const showDetails = (record: OcrResult) => {
    setCurrentRecord(record);
    const _isPdf = checkIsPdf(record.imageUrl);
    setIsPdf(_isPdf);

    const resultStr = record.textResult || '';

    if (_isPdf) {
      // === PDF 处理逻辑 ===
      // PDF 的结果直接是纯文本，不需要 JSON 解析
      setRawText(resultStr);
      setParsedItems([]);
    } else {
      // === 图片处理逻辑 ===
      // 图片的结果是 JSON 字符串，尝试解析
      try {
        const items = JSON.parse(resultStr);
        setParsedItems(items);
        // 为了方便复制全部，同时也生成一份纯文本
        setRawText(items.map((i: OcrItem) => i.ocrText?.text).join('\n'));
      } catch (e) {
        console.error("JSON Parse Error", e);
        setParsedItems([]);
        setRawText(resultStr); // 解析失败兜底显示原文
      }
    }

    setDrawerVisible(true);
  };

  // 复制全部文本
  const handleCopyAll = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText).then(() => {
      message.success('已复制全部内容');
    });
  };

  // 导出 TXT
  const handleExportTxt = () => {
    if (!rawText) return;
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr_result_${currentRecord?.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  // 下载原始文件 (PDF 或 图片)
  const handleDownloadSource = () => {
    if (currentRecord?.imageUrl) {
      window.open(currentRecord.imageUrl, '_blank');
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.9) return 'success';
    if (score > 0.8) return 'warning';
    return 'error';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '文件预览',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url: string) => {
        if (checkIsPdf(url)) {
          // PDF 显示图标
          return (
            <div style={{
              width: 80, height: 80, background: '#f5f5f5',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              border: '1px solid #d9d9d9', borderRadius: 4,
              cursor: 'pointer'
            }} onClick={() => window.open(url, '_blank')}>
              <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
              <span style={{ fontSize: 10, marginTop: 4, color: '#666' }}>PDF文档</span>
            </div>
          );
        }
        // 图片显示缩略图
        return <Image width={80} height={80} style={{objectFit: 'cover'}} src={url} alt="img" placeholder />;
      },
    },
    {
      title: '类型',
      key: 'type',
      width: 80,
      render: (_: any, record: OcrResult) => (
        checkIsPdf(record.imageUrl)
          ? <Tag color="red">PDF</Tag>
          : <Tag color="blue">图片</Tag>
      )
    },
    {
      title: '识别结果预览',
      dataIndex: 'textResult',
      key: 'textResult',
      ellipsis: true,
      render: (text: string, record: OcrResult) => {
        if (!text) return <Text disabled>无结果</Text>;

        if (checkIsPdf(record.imageUrl)) {
          // PDF 直接显示文本前一部分
          return <Text type="secondary" ellipsis>{text.slice(0, 50)}...</Text>;
        } else {
          // 图片解析 JSON 后显示
          try {
            const items = JSON.parse(text);
            const preview = items.slice(0, 2).map((i: any) => i.ocrText?.text).join(' ');
            return <Text type="secondary" ellipsis>{preview}</Text>;
          } catch {
            return <Text type="secondary" ellipsis>{text}</Text>;
          }
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: OcrResult) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => showDetails(record)}>
            详情
          </Button>
          <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id!)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Title level={4}>OCR 历史记录</Title>
          <Button type="primary" icon={<ReloadOutlined />} onClick={fetchResults} loading={loading}>
            刷新
          </Button>
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <span>{isPdf ? 'PDF 文档详情' : '图片识别详情'}</span>
            {isPdf && <Tag color="red">PDF</Tag>}
          </Space>
        }
        width={700}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button type="primary" ghost icon={<CopyOutlined />} onClick={handleCopyAll}>
              复制结果
            </Button>
            <Button icon={<FileTextOutlined />} onClick={handleExportTxt}>
              导出结果TXT
            </Button>
          </Space>
        }
      >
        {/* 上半部分：原文件展示区 */}
        <Card title="原始文件" size="small" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', background: '#fafafa', padding: 20 }}>
            {isPdf ? (
              <div style={{ textAlign: 'center' }}>
                <FilePdfOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }} />
                <div>
                  <Button type="link" onClick={handleDownloadSource} target="_blank">
                    点击预览/下载 PDF 文件
                  </Button>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  提示：浏览器通常支持直接预览第一页，或点击下载后查看
                </Text>
              </div>
            ) : (
              <Image src={currentRecord?.imageUrl} style={{ maxHeight: 300, objectFit: 'contain' }} />
            )}
          </div>
        </Card>

        {/* 下半部分：识别结果展示区 */}
        <Card title="识别结果" size="small">
          {/* PDF 模式：直接显示大段文本 TextArea */}
          {isPdf ? (
            <TextArea
              value={rawText}
              autoSize={{ minRows: 10, maxRows: 20 }}
              readOnly
              style={{ background: '#f9f9f9', fontFamily: 'monospace', fontSize: 14 }}
            />
          ) : (
            /* 图片模式：显示结构化列表 (带置信度) */
            <List
              itemLayout="horizontal"
              dataSource={parsedItems}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Tag color="geekblue">#{index + 1}</Tag>}
                    title={
                      <Paragraph copyable={{ text: item.ocrText?.text }} style={{ marginBottom: 0 }}>
                        {item.ocrText?.text}
                      </Paragraph>
                    }
                    description={
                      <Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>置信度:</Text>
                        <Tag color={getScoreColor(item.ocrText?.score)}>{(item.ocrText?.score * 100).toFixed(2)}%</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}

          {!rawText && <Empty description="暂无识别文字" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </Card>
      </Drawer>
    </div>
  );
};

export default OcrResultsPage;
