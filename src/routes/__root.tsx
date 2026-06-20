import { createRootRoute, Outlet } from '@tanstack/react-router'
import React, { Suspense } from 'react'

import Header from '../components/Header'
import { ContactModal } from '../components/ContactModal'

import { NotFound } from '../components/NotFound'

const TanStackDevtools = import.meta.env.PROD
  ? () => null // Render nothing in production
  : React.lazy(() =>
      import('@tanstack/react-devtools').then((res) => ({
        default: res.TanStackDevtools,
      }))
    )

const TanStackRouterDevtoolsPanel = import.meta.env.PROD
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
  return (
    <>
      <Header />
      <Outlet />
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
      <ContactModal />
    </>
  )
}
