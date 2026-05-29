import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Custom error thrown when both access_token AND refresh_token are expired.
 * The caller should prompt the user to re-login via OTP.
 */
export class TokenExpiredError extends Error {
    public merchantId: string;
    constructor(merchantId: string, message?: string) {
        super(message || 'Both access_token and refresh_token have expired. Re-login required.');
        this.name = 'TokenExpiredError';
        this.merchantId = merchantId;
    }
}

export interface TransactionOptions {
    from?: number;
    size?: number;
    merchantId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export class GobizService {
    private api: AxiosInstance;
    private clientId = 'go-biz-web-new';
    private xUniqueid: string;

    constructor(xUniqueid?: string) {
        this.xUniqueid = xUniqueid || uuidv4();

        this.api = axios.create({
            baseURL: 'https://api.gobiz.co.id',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'id',
                'authentication-type': 'go-id',
                'connection': 'keep-alive',
                'content-type': 'application/json',
                'gojek-country-code': 'ID',
                'gojek-timezone': 'Asia/Jakarta',
                'host': 'api.gobiz.co.id',
                'origin': 'https://portal.gofoodmerchant.co.id',
                'referer': 'https://portal.gofoodmerchant.co.id/',
                'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="124", "Chromium";v="124"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'x-appid': 'go-biz-web-new',
                'x-appversion': '3.50.0',
                'x-deviceos': 'Web',
                'x-phonemake': 'Windows 10 64-bit',
                'x-phonemodel': 'Chrome 124.0.0.0 on Windows 10 64-bit',
                'x-platform': 'Web',
                'x-uniqueid': this.xUniqueid,
                'x-user-locale': 'en-ID',
                'x-user-type': 'merchant',
            },
        });
    }

    getXUniqueid(): string {
        return this.xUniqueid;
    }
    async requestOtp(phoneNumber: string, countryCode: string = '62') {
        const payload = {
            client_id: this.clientId,
            phone_number: phoneNumber,
            country_code: countryCode,
        };

        const { data } = await this.api.post('/goid/login/request', payload, {
            headers: { authorization: undefined },
        });

        if (data.data?.access_token) {
            return {
                requiresOtp: false,
                accessToken: data.data.access_token,
            };
        }

        if (data.data?.otp_token) {
            return {
                requiresOtp: true,
                otpToken: data.data.otp_token,
                otpLength: data.data.otp_length,
                otpExpiresIn: data.data.otp_expires_in,
            };
        }

        throw new Error('Unexpected response from GoBiz login');
    }

    async verifyOtp(otp: string, otpToken: string) {
        const payload = {
            client_id: this.clientId,
            grant_type: 'otp',
            data: {
                otp: String(otp),
                otp_token: otpToken,
            },
        };

        const { data } = await this.api.post('/goid/token', payload, {
            headers: { 
                'authorization': undefined,
                'x-uniqueid': this.xUniqueid
            },
        });

        if (data.access_token) {
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            };
        }

        throw new Error('OTP verification failed: No access token received');
    }

    async refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const payload = {
            client_id: this.clientId,
            grant_type: 'refresh_token',
            data: {
                refresh_token: refreshToken,
            },
        };

        const { data } = await this.api.post('/goid/token', payload, {
            headers: { authorization: undefined },
        });

        if (data.access_token) {
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || refreshToken,
            };
        }

        throw new Error('Failed to refresh access token');
    }

    private isTokenExpiredError(error: unknown): boolean {
        if (error instanceof AxiosError) {
            const status = error.response?.status;
            const responseData = error.response?.data;
            const responseStr = JSON.stringify(responseData || '').toLowerCase();

            if (status === 401) return true;
            if (responseStr.includes('invalid/expired token') ||
                responseStr.includes('invalid token') ||
                responseStr.includes('expired token') ||
                (responseStr.includes('token') && responseStr.includes('expired'))) {
                return true;
            }
            if (status === 403) {
                if (responseStr.includes('token') && (responseStr.includes('expired') || responseStr.includes('invalid'))) {
                    return true;
                }
            }
        }
        return false;
    }
    
    async getTransactions(accessToken: string, options?: TransactionOptions) {
        const clauses: unknown[] = [
            {
                op: 'not',
                clauses: [
                    {
                        clauses: [
                            {
                                field: 'metadata.source',
                                op: 'in',
                                value: ['GOSAVE_ONLINE', 'GoSave', 'GODEALS_ONLINE'],
                            },
                            {
                                field: 'metadata.gopay.source',
                                op: 'in',
                                value: ['GOSAVE_ONLINE', 'GoSave', 'GODEALS_ONLINE'],
                            },
                        ],
                        op: 'or',
                    },
                ],
            },
            {
                field: 'metadata.transaction.status',
                op: 'in',
                value: ['settlement', 'capture', 'refund', 'partial_refund'],
            },
            {
                op: 'or',
                clauses: [
                    {
                        op: 'or',
                        clauses: [
                            {
                                field: 'metadata.transaction.payment_type',
                                op: 'in',
                                value: ['qris', 'gopay', 'offline_credit_card', 'offline_debit_card', 'credit_card'],
                            },
                        ],
                    },
                ],
            },
        ];

        if (options?.merchantId) {
            clauses.push({
                field: 'metadata.transaction.merchant_id',
                op: 'equal',
                value: options.merchantId,
            });
        }

        const payload = {
            from: options?.from || 0,
            size: options?.size || 20,
            sort: { time: { order: 'desc' } },
            included_categories: {
                incoming: ['transaction_share', 'action'],
            },
            query: [{ clauses, op: 'and' }],
        };

        const { data } = await this.api.post('/journals/search', payload, {
            headers: { authorization: `Bearer ${accessToken}` },
        });

        return data;
    }

    async getTransactionsWithAutoRefresh(
        merchantId: string,
        encryptedAccessToken: string,
        encryptedRefreshToken: string,
        options?: TransactionOptions
    ): Promise<{
        data: any;
        tokenRefreshed: boolean;
        newAccessToken?: string;
        newRefreshToken?: string;
    }> {
        const accessToken = decrypt(encryptedAccessToken);

        try {
            const data = await this.getTransactions(accessToken, options);
            return { data, tokenRefreshed: false };
        } catch (error) {
            if (!this.isTokenExpiredError(error)) {
                throw error;
            }
        }

        let refreshToken: string;
        try {
            refreshToken = decrypt(encryptedRefreshToken);
        } catch {
            throw new TokenExpiredError(merchantId, 'Failed to decrypt refresh token. Re-login required.');
        }

        try {
            const newTokens = await this.refreshAccessToken(refreshToken);
            const newEncryptedAccess = encrypt(newTokens.accessToken);
            const newEncryptedRefresh = encrypt(newTokens.refreshToken);
            
            const data = await this.getTransactions(newTokens.accessToken, options);
            return { 
                data, 
                tokenRefreshed: true,
                newAccessToken: newEncryptedAccess,
                newRefreshToken: newEncryptedRefresh
            };
        } catch (refreshError) {
            if (this.isTokenExpiredError(refreshError)) {
                throw new TokenExpiredError(merchantId);
            }
            throw refreshError;
        }
    }
}
