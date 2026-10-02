import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import React, { Suspense } from 'react'

import Header from '../components/Header'
import { ContactModal } from '../components/ContactModal'

import { NotFound } from '../components/NotFound'

export const TanStackDevtools = import.meta.env.PROD
  ? () => null // Render nothing in production
  : React.lazy(() =>
      import('@tanstack/react-devtools').then((res) => ({
        default: res.TanStackDevtools,
      }))
    )

export const TanStackRouterDevtoolsPanel = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import('@tanstack/react-router-devtools').then((res) => ({
        default: res.TanStackRouterDevtoolsPanel,
      }))
    )

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const location = useLocation()
  const isHWDealRoute = location.pathname.includes('/HWDeal')

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {!isHWDealRoute && (
        <div className="print:hidden">
          <Suspense fallback={null}>
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </Suspense>
        </div>
      )}

      <ContactModal />
    </>
  )
}
