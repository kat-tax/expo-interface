import {ScrollViewStyleReset} from 'expo-router/html';
import {getThemeCSS} from 'expo-interface';

export default function Root({children}: React.PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
        <style dangerouslySetInnerHTML={{__html: getThemeCSS()}}/>
        <ScrollViewStyleReset/>
      </head>
      <body>{children}</body>
    </html>
  );
}
