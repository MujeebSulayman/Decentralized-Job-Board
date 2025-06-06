import React from 'react'
import AdminDashboardLayout from '../layouts/AdminDashboardLayout'

const withAdminLayout = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithAdminLayout(props: P) {
    return (
      <AdminDashboardLayout>
        <WrappedComponent {...props} />
      </AdminDashboardLayout>
    )
  }
}

export default withAdminLayout