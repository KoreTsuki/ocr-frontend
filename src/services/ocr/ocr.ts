// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 上传文件获取任务ID POST /api/ocr/uploadFile */
export async function uploadFileUsingPost(
  params: any,
  body: {},
  file?: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<any>('/api/ocr/uploadFile', {
    method: 'POST',
    params: {
      ...params,
    },
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** 批量上传文件获取任务ID列表 POST /api/ocr/uploadFiles */
export async function uploadFilesUsingPost(
  params: any,
  body: {},
  formData: FormData,
  options?: { [key: string]: any },
) {
  return request<any>('/api/ocr/uploadFiles', {
    method: 'POST',
    params: {
      ...params,
    },
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** 通过URL创建OCR任务 POST /api/ocr/createTaskByUrl */
export async function createTaskByUrlUsingPost(
  params: { url: string },
  options?: { [key: string]: any },
) {
  return request<any>('/api/ocr/createTaskByUrl', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 查询任务状态 GET /api/ocr/task/status/{taskId} */
export async function getTaskStatusUsingGet(
  params: { taskId: string },
  options?: { [key: string]: any },
) {
  return request<any>(`/api/ocr/task/status/${params.taskId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 上传文件获取结果 POST /api/ocr/getByFile */
export async function getTextOnlyByFileUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: any,
  body: {},
  file?: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<any>('/api/ocr/getByFile', {
    method: 'POST',
    params: {
      ...params,
    },
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** 通过url获取结果 POST /api/ocr/getTotalByUrl */
export async function getTotalByUrlUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: any,
  options?: { [key: string]: any },
) {
  return request<any>('/api/ocr/getTotalByUrl', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取当前用户的全部识别结果 GET /api/ocr/getUserResults */
export async function getUserOcrResultsUsingGet(options?: { [key: string]: any }) {
  return request<any>('/api/ocr/getUserResults', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 根据识别结果ID删除该条识别结果 DELETE /api/ocr/deleteById/{id} */
export async function deleteOcrResultUsingDelete(
  id: number,
  options?: { [key: string]: any },
) {
  return request<any>(`/api/ocr/deleteById/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
