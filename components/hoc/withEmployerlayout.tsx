import React from 'react'
import EmployerDashboardLayout from '../layouts/EmployerDashboardLayout'

const withEmployerlayout = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithEmployerlayout(props: P) {
    return (
      <EmployerDashboardLayout>
        <WrappedComponent {...props} />
      </EmployerDashboardLayout>
    )
  }
}

export default withEmployerlayout