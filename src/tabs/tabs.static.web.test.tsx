import type {TabBarAction} from './types';
import {render, screen} from '@testing-library/react';
import {Text} from 'react-native';
import * as icons from '../__stories__/icons';
import {staticPage} from '../__tests__/static-page';
import {WebTabList} from './index.web';

/** The bar `Tabs` draws, with two tabs and the app's action; the router's triggers stand as text. */
const bar = (action: TabBarAction) => (
  <WebTabList logo="text-only" action={action}>
    <Text>Documents</Text>
    <Text>Inbox</Text>
  </WebTabList>
);

/**
 * What a static export writes for `tree`, in a container on the page, and
 * the container once `tree` has hydrated it. React reports a difference
 * between the server's HTML and the hydration render on the console, so the
 * hydration is checked to report none.
 */
async function hydrate(tree: React.ReactElement, before: (container: HTMLElement) => void, after: (container: HTMLElement) => void) {
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = await staticPage(tree);
  before(container);
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const {unmount} = render(tree, {container, hydrate: true});
    expect(errors).not.toHaveBeenCalled();
    after(container);
    unmount();
  } finally {
    errors.mockRestore();
    container.remove();
  }
}

describe('Tabs bar on a static page (web)', () => {
  it('draws the action from its first render on the client alone', () => {
    render(bar({label: 'New', icon: icons.add, onPress: () => {}}));
    expect(screen.getByTestId('tab-bar').contains(screen.getByTestId('tab-action'))).toBe(true);
  });

  it('draws the bar without the action until the page runs, and the action in the render after hydration', async () => {
    await hydrate(
      bar({label: 'New', icon: icons.add, onPress: () => {}}),
      () => {
        // The static page: the tabs with their labels and no action, which
        // leaves its room to the labels on a phone's bar.
        expect(screen.queryByTestId('tab-action')).toBeNull();
        expect(screen.getByTestId('tab-bar-tabs')).toHaveTextContent('DocumentsInbox');
      },
      () => {
        expect(screen.getByTestId('tab-bar').contains(screen.getByTestId('tab-action'))).toBe(true);
        expect(screen.getByTestId('tab-bar-tabs')).toHaveTextContent('DocumentsInbox');
      },
    );
  });

  it('brings an action with entries in the render after hydration, with its menu\'s ids', async () => {
    await hydrate(
      bar({label: 'New', icon: icons.add, items: [{label: 'Document'}, {label: 'Folder'}]}),
      container => {
        expect(screen.queryByTestId('tab-action')).toBeNull();
        expect(container.querySelector('[popover]')).toBeNull();
      },
      container => {
        const popover = container.querySelector('[popover]') as HTMLElement;
        expect(popover.id).toMatch(/^ui-menu-/);
        expect(screen.getByTestId('tab-action')).toHaveAttribute('popovertarget', popover.id);
      },
    );
  });
});
