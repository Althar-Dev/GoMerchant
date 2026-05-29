import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pay-gomerch.web.id';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/user/',
        '/admin/',
        '/api/',
        '/login',
        '/register',
        '/_next/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


