import axios, { AxiosError } from 'axios';
import * as qs from 'qs';

const OK_LOGIN_ENDPOINT = 'https://app.orderkuota.com/api/v2/login';
const OK_GET_ENDPOINT = 'https://app.orderkuota.com/api/v2/get';

const OK_HEADERS = {
  'User-Agent': 'okhttp/4.12.0',
  'Host': 'app.orderkuota.com',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip',
  'Connection': 'keep-alive',
};

// Konstanta perangkat yang disesuaikan untuk meminimalisir deteksi "Gunakan Jaringan Lain"
const OK_CONSTANTS = {
  app_reg_id: 'cUx8YuXhS5yLKPOaY6_zv_:APA91bH7c1pEuuxtYnTgJAegkbDkj8cicnpkEEQkp0v2yr3bEfWKqIYCuNkwX_VdUjQuJ3UpP75mb72I3kowTpXGomHsspEfIaNnVabdrCEeHFG2IEWWLPU',
  phone_uuid: 'cUx8YuXhS5yLKPOaY6_zv_',
  phone_model: 'SM-G998B',
  phone_android_version: '31',
  app_version_code: '250811',
  app_version_name: '25.08.11',
  ui_mode: 'dark',
};

const TIMEOUT = 30000;
const MAX_RETRIES = 1;

async function requestWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: any = null;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Teruskan pesan asli dari server OrderKuota (termasuk blokir jaringan)
        if (status >= 400) {
          const message = data?.error || data?.message || error.message;
          const newError = new Error(message);
          (newError as any).status = status;
          (newError as any).data = data;
          throw newError;
        }
      }

      if (i < retries) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function requestOtp(username: string, password: string): Promise<unknown> {
  return requestWithRetry(async () => {
    const payload = qs.stringify({
      username,
      password,
      ...OK_CONSTANTS,
    });

    const response = await axios.post(OK_LOGIN_ENDPOINT, payload, {
      headers: OK_HEADERS,
      timeout: TIMEOUT,
    });

    return response.data;
  });
}

export async function getToken(username: string, otp: string): Promise<unknown> {
  return requestWithRetry(async () => {
    const payload = qs.stringify({
      username,
      password: otp,
      ...OK_CONSTANTS,
    });

    const response = await axios.post(OK_LOGIN_ENDPOINT, payload, {
      headers: OK_HEADERS,
      timeout: TIMEOUT,
    });

    return response.data;
  });
}

export async function generateQrisAjaib(
  username: string,
  token: string,
  amount: number
): Promise<unknown> {
  return requestWithRetry(async () => {
    const timestamp = Date.now().toString();
    const payload = qs.stringify({
      ...OK_CONSTANTS,
      auth_username: username,
      auth_token: token,
      request_time: timestamp,
      'requests[qris_ajaib][amount]': amount.toString(),
    });

    const response = await axios.post(OK_GET_ENDPOINT, payload, {
      headers: OK_HEADERS,
      timeout: TIMEOUT,
    });

    return response.data;
  });
}

export async function getQrisHistory(
  username: string,
  token: string,
  historyType: string = 'qris_history'
): Promise<unknown> {
  return requestWithRetry(async () => {
    const timestamp = Date.now().toString();
    const tokenId = token.split(':')[0];

    const payload = qs.stringify({
      ...OK_CONSTANTS,
      [`requests[${historyType}][keterangan]`]: '',
      [`requests[${historyType}][jumlah]`]: '',
      request_time: timestamp,
      auth_username: username,
      [`requests[${historyType}][page]`]: '1',
      auth_token: token,
      [`requests[${historyType}][dari_tanggal]`]: '',
      'requests[0]': 'account',
      [`requests[${historyType}][ke_tanggal]`]: '',
    });

    const response = await axios.post(
      `https://app.orderkuota.com/api/v2/qris/mutasi/${tokenId}`,
      payload,
      {
        headers: OK_HEADERS,
        timeout: TIMEOUT,
      }
    );

    return response.data;
  });
}

export async function getBalance(username: string, token: string): Promise<unknown> {
  return requestWithRetry(async () => {
    const timestamp = Date.now().toString();
    const tokenId = token.split(':')[0];

    const payload = qs.stringify({
      ...OK_CONSTANTS,
      request_time: timestamp,
      auth_username: username,
      'requests[1]': 'qris_menu',
      auth_token: token,
      'requests[0]': 'account',
    });

    const response = await axios.post(
      `https://app.orderkuota.com/api/v2/qris/menu/${tokenId}`,
      payload,
      {
        headers: OK_HEADERS,
        timeout: TIMEOUT,
      }
    );

    return response.data;
  });
}

