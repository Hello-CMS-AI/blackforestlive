import AppLayout from "../components/Layout";
import "../styles/globals.scss"; // Updated to .scss

function MyApp({ Component, pageProps }) {
  const useLayout = Component.useLayout !== false;

  return useLayout ? (
    <AppLayout>
      <Component {...pageProps} />
    </AppLayout>
  ) : (
    <Component {...pageProps} />
  );
}

export default MyApp;