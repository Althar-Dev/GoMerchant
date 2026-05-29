import { NextRequest, NextResponse } from 'next/server';
import * as QRCode from 'qrcode';

/**
 * Endpoint untuk menghasilkan gambar QR Code dari string QRIS.
 * Menerima method POST dengan body JSON: { qris_string, size?, format? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qris_string, size = 300, format = 'png' } = body;

    if (!qris_string) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'qris_string wajib diisi' },
      }, { status: 400 });
    }

    const options: QRCode.QRCodeToDataURLOptions = {
      type: format === 'png' ? 'image/png' : 'image/jpeg',
      width: Math.min(Math.max(size, 100), 1000), 
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };

    const dataUrl = await QRCode.toDataURL(qris_string, options);

    return NextResponse.json({
      success: true,
      data: {
        qr_image: dataUrl,
        size: options.width,
        format,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return NextResponse.json({
      success: false,
      error: { code: 'IMAGE_ERROR', message },
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

