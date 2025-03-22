import AppLayout from "../components/Layout";
import "../styles/globals.css";
import { ConfigProvider } from 'antd';

function MyApp({ Component, pageProps }) {
  const useLayout = Component.useLayout !== false;

  return (
    <ConfigProvider>
      {useLayout ? (
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
      ) : (
        <Component {...pageProps} />
      )}
    </ConfigProvider>
  );
}

export default MyApp;