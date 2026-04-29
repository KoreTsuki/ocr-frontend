import React, { useEffect, useState } from 'react';
import { Table, Button, message, Space, Card, Typography, Image, Drawer, List, Tag, Empty, Input } from 'antd';
import { DeleteOutlined, ReloadOutlined, EyeOutlined, CopyOutlined, FilePdfOutlined, SaveOutlined, FileTextOutlined } from '@ant-design/icons';
import { getUserOcrResultsUsingGet, deleteOcrResultUsingDelete, auditOcrResultUsingPost, getAuditLogsUsingGet } from '@/services/ocr/ocr';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface OcrItem {
  coordinates: { x: number; y: number }[];
  ocrText: {
    text: string;
    score: number;
  };
}

const OcrResultsPage = () => {
  const [data, setData] = useState<API.OcrResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.OcrResult | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [parsedItems, setParsedItems] = useState<OcrItem[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [auditText, setAuditText] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<API.OcrAuditLog[]>([]);
  const [savingAudit, setSavingAudit] = useState(false);

  const checkIsPdf = (url?: string) => {
    if (!url) return false;
    return url.split('?')[0].toLowerCase().endsWith('.pdf');
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

  const extractPlainText = (record: API.OcrResult) => {
    const resultStr = record.textResult || '';
    if (checkIsPdf(record.imageUrl)) {
      return resultStr;
    }
    try {
      const items = JSON.parse(resultStr);
      return items.map((item: OcrItem) => item.ocrText?.text).join('\n');
    } catch (error) {
      return resultStr;
    }
  };

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

  const loadAuditLogs = async (id?: number) => {
    if (!id) {
      setAuditLogs([]);
      return;
    }
    try {
      const response = await getAuditLogsUsingGet(id);
      if (response.code === 200) {
        setAuditLogs(response.data || []);
      }
    } catch (error) {
      setAuditLogs([]);
    }
  };

  const showDetails = (record: API.OcrResult) => {
    setCurrentRecord(record);
    const pdf = checkIsPdf(record.imageUrl);
    const resultStr = record.textResult || '';

    setIsPdf(pdf);
    if (pdf) {
      setRawText(resultStr);
      setParsedItems([]);
    } else {
      try {
        const items = JSON.parse(resultStr);
        setParsedItems(items);
        setRawText(items.map((item: OcrItem) => item.ocrText?.text).join('\n'));
      } catch (error) {
        setParsedItems([]);
        setRawText(resultStr);
      }
    }

    setAuditText(record.auditText || extractPlainText(record));
    loadAuditLogs(record.id);
    setDrawerVisible(true);
  };

  const handleCopyAll = () => {
    if (!auditText) return;
    navigator.clipboard.writeText(auditText).then(() => {
      message.success('已复制审核文本');
    });
  };

  const handleDownloadSource = () => {
    if (currentRecord?.imageUrl) {
      window.open(currentRecord.imageUrl, '_blank');
    }
  };

  const handleExportTxt = () => {
    const exportText = (auditText || rawText || '').trim();
    if (!exportText) {
      message.warning('暂无可导出的识别结果');
      return;
    }

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileType = isPdf ? 'pdf' : 'image';
    link.href = url;
    link.download = `ocr_${fileType}_result_${currentRecord?.id || Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('TXT 导出成功');
  };

  const handleSaveAudit = async () => {
    if (!currentRecord?.id || !auditText.trim()) {
      message.warning('请先填写审核文本');
      return;
    }
    setSavingAudit(true);
    try {
      const response = await auditOcrResultUsingPost(currentRecord.id, { auditText });
      if (response.code === 200 && response.data) {
        message.success('审核结果已保存');
        await fetchResults();
        await loadAuditLogs(currentRecord.id);
        setCurrentRecord((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            auditText,
            auditStatus: rawText.trim() === auditText.trim() ? 1 : 2,
          };
        });
      } else {
        message.error('审核保存失败');
      }
    } catch (error) {
      message.error('审核保存失败');
    } finally {
      setSavingAudit(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.9) return 'success';
    if (score > 0.8) return 'warning';
    return 'error';
  };

  const getAuditStatusTag = (status?: number) => {
    if (status === 1) return <Tag color="success">审核通过</Tag>;
    if (status === 2) return <Tag color="processing">人工修补</Tag>;
    return <Tag color="default">待审核</Tag>;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '文件预览',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url: string) => {
        if (checkIsPdf(url)) {
          return (
            <div
              style={{
                width: 80,
                height: 80,
                background: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={() => window.open(url, '_blank')}
            >
              <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
              <span style={{ fontSize: 10, marginTop: 4, color: '#666' }}>PDF文档</span>
            </div>
          );
        }
        return <Image width={80} height={80} style={{ objectFit: 'cover' }} src={url} alt="img" placeholder referrerPolicy="no-referrer" />;
      },
    },
    {
      title: '类型',
      key: 'type',
      width: 80,
      render: (_: any, record: API.OcrResult) => (checkIsPdf(record.imageUrl) ? <Tag color="red">PDF</Tag> : <Tag color="blue">图片</Tag>),
    },
    {
      title: '识别结果预览',
      dataIndex: 'textResult',
      key: 'textResult',
      ellipsis: true,
      render: (text: string, record: API.OcrResult) => {
        const previewText = record.auditText || extractPlainText(record) || text;
        if (!previewText) return <Text disabled>无结果</Text>;
        return <Text type="secondary" ellipsis>{previewText.slice(0, 50)}</Text>;
      },
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 120,
      render: (value: number) => getAuditStatusTag(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: API.OcrResult) => (
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

      <Drawer
        title={
          <Space>
            <span>{isPdf ? 'PDF 文档详情' : '图片识别详情'}</span>
            {currentRecord ? getAuditStatusTag(currentRecord.auditStatus) : null}
          </Space>
        }
        width={760}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button type="primary" ghost icon={<CopyOutlined />} onClick={handleCopyAll}>
              复制审核文本
            </Button>
            <Button icon={<FileTextOutlined />} onClick={handleExportTxt}>
              导出TXT
            </Button>
            <Button icon={<SaveOutlined />} onClick={handleSaveAudit} loading={savingAudit}>
              保存审核
            </Button>
          </Space>
        }
      >
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
              <Image src={currentRecord?.imageUrl} style={{ maxHeight: 300, objectFit: 'contain' }} referrerPolicy="no-referrer" />
            )}
          </div>
        </Card>

        <Card title="OCR原始结果" size="small" style={{ marginBottom: 20 }}>
          {isPdf ? (
            <TextArea
              value={rawText}
              autoSize={{ minRows: 10, maxRows: 20 }}
              readOnly
              style={{ background: '#f9f9f9', fontFamily: 'monospace', fontSize: 14 }}
            />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={parsedItems}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Tag color="geekblue">#{index + 1}</Tag>}
                    title={<Paragraph copyable={{ text: item.ocrText?.text }} style={{ marginBottom: 0 }}>{item.ocrText?.text}</Paragraph>}
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

        <Card title="人工审核结果" size="small" style={{ marginBottom: 20 }}>
          <TextArea
            value={auditText}
            onChange={(e) => setAuditText(e.target.value)}
            autoSize={{ minRows: 8, maxRows: 18 }}
            style={{ background: '#fff', fontFamily: 'monospace', fontSize: 14 }}
          />
        </Card>

        <Card title="审核日志" size="small">
          <List
            locale={{ emptyText: '暂无审核日志' }}
            dataSource={auditLogs}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`审核人ID：${item.reviewerId ?? '-'} ｜ 时间：${item.createTime ?? '-'}`}
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}>
                        修改前：{item.beforeText || '-'}
                      </Paragraph>
                      <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}>
                        修改后：{item.afterText || '-'}
                      </Paragraph>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Drawer>
    </div>
  );
};

export default OcrResultsPage;
