import Layout from '@/pages/dashboard/layout';
import React from 'react';

export const withDashboardLayout = (PageComponent: React.FC) => {
  return function WrappedPage(props: any) {
    return (
      <Layout>
        <PageComponent {...props} />
      </Layout>
    );
  };
};
