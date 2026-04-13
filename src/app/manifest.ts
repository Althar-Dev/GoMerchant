import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GomerchPay API by AltharDev',
    short_name: 'GomerchPay',
    description: 'Gateway Pembayaran QRIS Otomatis GoPay Merchant oleh StarVale',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#619BF3',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
