import '@dao-dao/ui/styles/index.css'
import '@fontsource/inter/latin.css'
import '@fontsource/jetbrains-mono/latin.css'

import { useState, useEffect, Suspense } from 'react'

import type { AppProps } from 'next/app'

import { RecoilRoot, useRecoilState } from 'recoil'

import { activeThemeAtom } from '@dao-dao/state'
import { ThemeProvider, Theme, LoadingScreen } from '@dao-dao/ui'
import { SITE_TITLE } from '@dao-dao/utils'
import { DefaultSeo } from 'next-seo'

import { ErrorBoundary, Footer, Header, Notifications } from '@/components'

const description = process.env.NEXT_PUBLIC_SITE_DESCRIPTION
const image = process.env.NEXT_PUBLIC_SITE_IMAGE
const url = process.env.NEXT_PUBLIC_SITE_URL

const InnerApp = ({ Component, pageProps }: AppProps) => {
  const [theme, setTheme] = useRecoilState(activeThemeAtom)
  const [accentColor, setAccentColor] = useState<string | undefined>()

  // Ensure correct theme class is set on document.
  useEffect(() => {
    Object.values(Theme).forEach((value) =>
      document.documentElement.classList.toggle(value, value === theme)
    )
  }, [theme])

  return (
    <ThemeProvider
      accentColor={accentColor}
      setAccentColor={setAccentColor}
      theme={theme}
      updateTheme={setTheme}
    >
      <ErrorBoundary title="An unexpected error occurred.">
        <Suspense fallback={<LoadingScreen />}>
          <Header />

          <Component {...pageProps} />

          <Footer />
        </Suspense>
      </ErrorBoundary>

      <Notifications />
    </ThemeProvider>
  )
}

const MyApp = (props: AppProps) => (
  <>
    <DefaultSeo
      additionalLinkTags={[
        {
          href: '/apple-touch-icon.png',
          rel: 'apple-touch-icon',
          sizes: '180x180',
          type: 'image/png',
        },
        {
          href: '/favicon-32x32.png',
          rel: 'icon',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          href: '/favicon-16x16.png',
          rel: 'icon',
          sizes: '16x16',
          type: 'image/png',
        },
        {
          href: '/site.webmanifest',
          rel: 'manifest',
        },
      ]}
      additionalMetaTags={[
        {
          name: 'msapplication-TileColor',
          content: '#da532c',
        },
        {
          name: 'theme-color',
          content: '#ffffff',
        },
      ]}
      description={description}
      openGraph={{
        url,
        type: 'website',
        title: SITE_TITLE,
        description,
        images: image ? [{ url: image }] : [],
      }}
      title={SITE_TITLE}
      twitter={{
        cardType: 'summary_large_image',
      }}
    />

    <RecoilRoot>
      <InnerApp {...props} />
    </RecoilRoot>
  </>
)

export default MyApp
