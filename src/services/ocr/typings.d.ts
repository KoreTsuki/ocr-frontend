declare namespace API {
  type getAuthUsingPOSTParams = {
    username?: string;
    password?: string;
  };

  type getTextOnlyByFileUsingPOSTParams = {
    filterType?: string;
    isAggregate?: boolean;
  };

  type getTotalByUrlUsingPOSTParams = {
    filterType?: string;
    isAggregate?: boolean;
    url?: string;
  };

  type LoginUserVO = {
    token?: string;
  };

  type RequestMsgEntity = {
    content?: string;
    createTime?: number;
    fromUserName?: string;
    msgId?: number;
    msgType?: string;
    picUrl?: string;
    toUserName?: string;
  };

  type ResponseMsgEntity = {
    content?: string;
    createTime?: number;
    fromUserName?: string;
    msgType?: string;
    toUserName?: string;
  };

  type ResultListObject_ = {
    code?: number;
    data?: Record<string, any>[];
    msg?: string;
  };

  type ResultLoginUserVO_ = {
    code?: number;
    data?: LoginUserVO;
    msg?: string;
  };

  type ResultUserEntity_ = {
    code?: number;
    data?: UserEntity;
    msg?: string;
  };

  type UserEntity = {
    id?: number;
    name?: string;
    lines?: number;
    openid?: string;
  };

  type validateUsingGETParams = {
    appid: string;
    echostr?: string;
    nonce?: string;
    signature?: string;
    timestamp?: string;
  };

  type postUsingPOSTParams = {
    appid: string;
    echostr?: string;
    nonce?: string;
    signature?: string;
    timestamp?: string;
  };

  type Coordinate = {
    x?: number;
    y?: number;
  };

  type OcrText = {
    text?: string;
    score?: number;
  };

  type OcrResultItem = {
    coordinates?: Coordinate[];
    ocrText?: OcrText;
  };

  type OcrResult = {
    id?: number;
    userId?: number;
    imageUrl?: string;
    textResult?: string;
    auditText?: string;
    auditStatus?: number;
    reviewerId?: number;
    auditTime?: string;
    isDelete?: number;
  };

  type OcrAuditLog = {
    id?: number;
    resultId?: number;
    userId?: number;
    reviewerId?: number;
    beforeText?: string;
    afterText?: string;
    createTime?: string;
  };

  type SysOcrTask = {
    id?: number;
    taskId?: string;
    userId?: number;
    fileName?: string;
    fileUrl?: string;
    status?: string;
    errorMessage?: string;
    createTime?: string;
    updateTime?: string;
    startTime?: string;
    completeTime?: string;
    queuePosition?: number;
    consumerId?: string;
    executeDurationMs?: number;
  };

  type ResultListOcrResult_ = {
    code?: number;
    msg?: string;
    data?: OcrResult[];
  };

  type ResultBoolean_ = {
    code?: number;
    msg?: string;
    data?: boolean;
  };

  type ResultListOcrAuditLog_ = {
    code?: number;
    msg?: string;
    data?: OcrAuditLog[];
  };

  type ResultListSysOcrTask_ = {
    code?: number;
    msg?: string;
    data?: SysOcrTask[];
  };
}
