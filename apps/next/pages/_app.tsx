import { withTRPC } from "@trpc/next";
import type { AppRouter } from "api/src/index";
import { Provider } from "app/provider";
import { AppContext } from "next/app";
import Head from "next/head";
import "raf/polyfill";
import type { SolitoAppProps } from "solito";

interface MyAppProps extends SolitoAppProps {
  pageProps: {};
}

function MyApp({ Component, pageProps: { ...pageProps } }: MyAppProps) {
  return (
    <>
      <Head>
        <title>Kaol Starter</title>
        <meta
          name="description"
          content="Expo + Next.js with Kaol. By @chamatt."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Provider>
        <Component {...pageProps} />
      </Provider>
    </>
  );
}

MyApp.getInitialProps = async ({ ctx }: AppContext) => {
  // const { req, res } = ctx || {};
  return {
    pageProps: {},
  };
};

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.browser) return ""; // Browser should use current path
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default withTRPC<AppRouter>({
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    const url = `${getBaseUrl()}/api/trpc`;

    return {
      url,

      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
      headers: async () => {
        const { req, res } = ctx || {};
        if (ctx?.req) {
          // on ssr, forward client's headers to the server
          return {
            ...ctx.req.headers,
            "x-ssr": "1",
          };
        }
        return {};
      },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: true,
})(MyApp);
