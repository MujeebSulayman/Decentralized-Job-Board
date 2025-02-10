import React from 'react'
import AdminDashboardLayout from '../layouts/AdminDashboardLayout'

const withAdminLayout = (WrappedComponent: React.ComponentType<any>) => {
  return function WithAdminLayout(props: any) {
    return (
      <AdminDashboardLayout>
        <WrappedComponent {...props} />
      </AdminDashboardLayout>
    )
  }
}

export default withAdminLayout