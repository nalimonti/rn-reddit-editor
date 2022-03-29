const parsePath = require('parse-filepath');

const MIME_TYPES = {
  png: 'image/png',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
}

export const _fetch = async (method: string, path: string, accessToken: string, data?: FormData|{ [key: string]: string }) => {
  const url = new URL(`https://oauth.reddit.com/${path}`),
    config: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'rn-reddit-editor',
        Authorization: `bearer ${accessToken}`
      },
    };
  if (data) {
    if (['post', 'put', 'patch'].includes(method.toLowerCase()))
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    else if (typeof data === 'object' && !(data instanceof FormData)) {
      Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
    }
  }
  const res = await fetch(url.toString(), config),
    json = await res.json();
  if (![200, 201].includes(res.status)) return Promise.reject(json)
  console.log('res', res, json, res.status);
  return json;
}

export const imageToBlob = async (uri: string): Promise<Blob> => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
    resolve(xhr.response);
  };
  xhr.onerror = function (e) {
    console.log(e);
    reject(new TypeError('Network request failed'));
  };
  xhr.responseType = 'blob';
  xhr.open('GET', uri, true);
  xhr.send(null);
});

export const postMediaAsset = async (filepath: string, mimetype: string, accessToken: string) => {
  console.log('postMediaAsset', filepath, mimetype, accessToken)
  const data = new FormData();
  data.append('filepath', filepath);
  data.append('mimetype', mimetype);
  return await _fetch('POST', 'api/media/asset.json', accessToken, data)
}

export const uploadImage = async (file: string, accessToken: string, caption?: string) => {
  const fileParts = parsePath(file),
    { basename } = fileParts,
    ext = fileParts.extname.replace('.', '');
  if (!(ext in MIME_TYPES)) throw new Error('Unknown MIME type: ' + ext);
  try {
    const uploadRes = await postMediaAsset(basename, (MIME_TYPES as any)[ext], accessToken);
    console.log('upload res', uploadRes)
    const parsedFile = await imageToBlob(file);
    const uploadURL = 'https:' + uploadRes.args.action;
    const fileInfo = {
      fileUrl: uploadURL + '/' + uploadRes.args.fields.find(({ name }: { name: string }) => name === 'key').value,
      assetId: uploadRes.asset.asset_id,
      websocketUrl: uploadRes.asset.websocket_url,
      caption,
    };
    const formData = new FormData();
    uploadRes.args.fields.forEach(({ name, value }: { name: string; value: string }) => formData.append(name, value));
    formData.append('file', parsedFile, basename);
    const res = await fetch(uploadURL, {
      method: 'post',
      mode: 'no-cors',
      body: formData
    });

    console.log('res', res);
    return fileInfo.assetId;
  }
  catch (e) {
    console.log('error', e);
    return Promise.reject(e);
  }
}
