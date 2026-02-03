import React, { useState, useEffect, useRef } from 'react';
import { Upload, message, Switch, Input, Card, Space, Button, Typography, Table, Tag, Progress } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';


import { uploadFilesUsingPost, createTaskByUrlUsingPost, getTaskStatusUsingGet } from '@/services/ocr/ocr';

const { Text } = Typography;

interface TaskInfo {
  taskId: string;
  fileName: string;
  status: string;
  queuePosition: number;
  errorMessage?: string;
  createTime?: string;
  updateTime?: string;
}

const Ocr: React.FC = () => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [useUrl, setUseUrl] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [taskList, setTaskList] = useState<TaskInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 使用 useRef 存储最新的任务列表，防止定时器闭包拿到旧数据
  const taskListRef = useRef<TaskInfo[]>([]);

  const pollingInterval = useRef<number | undefined>(undefined);

  // 同步 ref 和 state
  useEffect(() => {
    taskListRef.current = taskList;
  }, [taskList]);

  // 停止轮询
  const stopPolling = () => {
    if (pollingInterval.current) {
      window.clearInterval(pollingInterval.current);
      // 重置为 undefined
      pollingInterval.current = undefined;
    }
  };

  // 更新任务状态的核心逻辑
  const updateTaskStatus = async () => {
    const currentTasks = taskListRef.current;

    // 找出还在队列中或处理中的任务
    const activeTasks = currentTasks.filter(
      (t) => t.status === 'WAITING' || t.status === 'PROCESSING'
    );

    // 如果没有活跃任务，停止轮询
    if (activeTasks.length === 0) {
      stopPolling();
      return;
    }

    try {
      const updatedTasks = await Promise.all(
        currentTasks.map(async (task) => {
          // 只更新未完成的任务
          if (task.status === 'WAITING' || task.status === 'PROCESSING') {
            const response = await getTaskStatusUsingGet({ taskId: task.taskId });
            if (response.code === 200 && response.data) {
              return {
                ...task,
                status: response.data.status,
                errorMessage: response.data.errorMessage,
                updateTime: response.data.updateTime,
                queuePosition: response.data.queuePosition || 0,
              };
            }
          }
          return task;
        })
      );
      setTaskList(updatedTasks);
    } catch (error) {
      console.error('轮询更新失败:', error);
    }
  };

  // 开始轮询
  const startPolling = () => {
    stopPolling(); // 开启前先清除旧的
    pollingInterval.current = window.setInterval(() => {
      updateTaskStatus();
    }, 3000);
  };

  // 处理多文件上传
  const handleMultiFileUpload = async () => {
    if (fileList.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      fileList.forEach((file) => formData.append('files', file));

      const response = await uploadFilesUsingPost({}, {}, formData);
      if (response.code === 200 && response.data) {
        const newTasks: TaskInfo[] = response.data.map((item: any) => ({
          taskId: item.taskId,
          fileName: item.fileName,
          status: 'WAITING',
          queuePosition: item.queuePosition || 0,
        }));
        setTaskList((prev) => [...prev, ...newTasks]);
        message.success(`成功上传 ${newTasks.length} 个文件`);
        startPolling();
      }
    } catch (error) {
      message.error('文件上传出错');
    } finally {
      setIsUploading(false);
      setFileList([]);
    }
  };

  // 处理URL提交
  const handleUrlSubmit = async () => {
    if (!urlValue) return;
    setIsUploading(true);
    try {
      const response = await createTaskByUrlUsingPost({ url: urlValue });
      if (response.code === 200 && response.data) {
        const newTask: TaskInfo = {
          taskId: response.data.taskId,
          fileName: response.data.fileName || 'URL图片',
          status: 'WAITING',
          queuePosition: response.data.queuePosition || 0,
        };
        setTaskList((prev) => [...prev, newTask]);
        message.success('URL提交成功');
        startPolling();
      }
    } catch (error) {
      message.error('URL请求出错');
    } finally {
      setIsUploading(false);
      setUrlValue('');
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, any> = {
      WAITING: { color: 'blue', icon: <ClockCircleOutlined />, text: '等待中' },
      PROCESSING: { color: 'processing', icon: <LoadingOutlined />, text: '处理中' },
      SUCCESS: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
      FAILED: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
    };
    const item = config[status] || { color: 'default', text: '未知' };
    return <Tag icon={item.icon} color={item.color}>{item.text}</Tag>;
  };

  const columns = [
    { title: '文件名', dataIndex: 'fileName', key: 'fileName' },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '队列位置', dataIndex: 'queuePosition', key: 'queuePosition' },
    {
      title: '进度',
      dataIndex: 'status',
      key: 'progress',
      render: (status: string) => (
        <Progress
          percent={status === 'SUCCESS' || status === 'FAILED' ? 100 : status === 'PROCESSING' ? 50 : 10}
          size="small"
          status={status === 'FAILED' ? 'exception' : status === 'SUCCESS' ? 'success' : 'active'}
        />
      ),
    },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
  ];

  useEffect(() => {
    return () => stopPolling();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Card title="OCR 任务管理" style={{ marginBottom: 20 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Text>识别方式：</Text>
            <Switch checked={useUrl} onChange={(checked) => setUseUrl(checked)} />
            <Text>{useUrl ? 'URL模式' : '文件模式'}</Text>
          </Space>

          {useUrl ? (
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="请输入图片 URL"
                value={urlValue}
                onChange={e => setUrlValue(e.target.value)}
              />
              <Button type="primary" onClick={handleUrlSubmit} loading={isUploading}>提交</Button>
            </Space.Compact>
          ) : (
            <Upload.Dragger
              multiple
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList(prev => [...prev, file]);
                return false;
              }}
              onRemove={(file) => setFileList(prev => prev.filter(f => f.uid !== file.uid))}
            >
              <p className="ant-upload-drag-icon"><UploadOutlined /></p>
              <p className="ant-upload-text">点击或拖拽上传</p>
            </Upload.Dragger>
          )}

          {!useUrl && (
            <Button
              type="primary"
              onClick={handleMultiFileUpload}
              disabled={fileList.length === 0}
              loading={isUploading}
            >
              开始上传并识别
            </Button>
          )}

        </Space>
      </Card>

      {taskList.length > 0 && (
        <Card title="任务列表">
          <Table
            columns={columns}
            dataSource={taskList}
            rowKey="taskId"
            pagination={{ pageSize: 5 } as TablePaginationConfig}
          />
        </Card>
      )}
    </div>
  );
};

export default Ocr;
