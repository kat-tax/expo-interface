import type {ReactElement} from 'react';

/**
 * The HTML a static export writes for `tree`: the server renders the page
 * inside the whole `+html` document, and the browser hydrates `#root` alone.
 * `useId` derives an id from the element's place in the tree, so the ids in
 * the document's render differ from the ones the hydration render gives the
 * same elements, and React keeps a server attribute the hydration render
 * disagrees with. A web test puts this HTML in a container and hydrates
 * `tree` into it to see what a static page's reader gets.
 */
export async function staticPage(tree: ReactElement): Promise<string> {
  // The one function of `react-dom/server` the tests call: the repository carries no types for react-dom.
  const {renderToString} = (await import('react-dom/server' as string)) as {renderToString: (element: ReactElement) => string};
  const html = renderToString(
    <html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <title>Page</title>
      </head>
      <body>
        <div id="root">{tree}</div>
      </body>
    </html>,
  );
  return new DOMParser().parseFromString(html, 'text/html').getElementById('root')!.innerHTML;
}
