import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Keep the window from ever scrolling — every page is a scrollable
// ScreenScrollView, so letting the body scroll causes the classic
// "clicking a button jumps to the top of the page" behaviour on web.
const globalStyles = `
  html,
  body {
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    background: #F8FAFC;
    -webkit-tap-highlight-color: transparent;
  }
  #root {
    height: 100%;
  }
  * {
    box-sizing: border-box;
  }
`;