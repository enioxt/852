import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tira-Voz: o radar da base',
    short_name: 'Tira-Voz',
    description: 'Canal seguro e anônimo para policiais civis de MG.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/brand/logo-852.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/logo-852.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
