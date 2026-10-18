import type {ReactNode} from 'react';
import type {MenuItem} from '../menu/types';
import {Text} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {InHeaderContext} from '../header/shared';
import {TabStack} from '../tab-stack';
import {InBarContext, NarrowBarContext} from '../tabs/context';
import {renderApp} from 'expo-vitest/router';
import {HeaderMenu} from '.';

const items: MenuItem[] = [
  {label: 'Blank document', icon: icons.add},
  {label: 'Import files…', icon: icons.share},
];

/** The control as a header draws it: inside the header's trailing slot. */
function inHeader(node: ReactNode) {
  return <InHeaderContext.Provider value={true}>{node}</InHeaderContext.Provider>;
}

/** An app whose root screen renders the control in its content. */
function app(control: ReactNode) {
  return {
    _layout: () => <TabStack title="Drops"/>,
    index: () => (
      <>
        {control}
        <Text>Home screen</Text>
      </>
    ),
  };
}

describe('HeaderMenu (web)', () => {
  it('renders the plain header-sized text menu trigger for a custom header', () => {
    renderDom(inHeader(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>));
    const trigger = dom.getByRole('button', {name: 'New…'});
    expect(trigger).toHaveClass('ui-button--text', 'ui-button--medium');
    expect(trigger).toHaveAttribute('data-testid', 'new');
    expect(dom.getAllByRole('menuitem', {hidden: true})
      .map(e => e.querySelector('.ui-menu__label')?.textContent))
      .toEqual(['Blank document', 'Import files…']);
    expect(document.querySelector('[style*="--expo-ui-primary-500"]')).toBeNull();
  });

  it('drops to the bar size when it is folded into the web tab bar', () => {
    renderDom(
      <InBarContext.Provider value={true}>
        <HeaderMenu label="New…" icon={icons.add} items={items}/>
      </InBarContext.Provider>,
    );
    const trigger = dom.getByRole('button', {name: 'New…'});
    // The bar is the height of its tabs; a header-sized button would grow it.
    expect(trigger).toHaveClass('ui-button--small');
    expect(trigger).not.toHaveClass('ui-button--medium');
  });

  it('shows the icon alone in a bar too narrow for labels, unless it has none', () => {
    renderDom(
      <InBarContext.Provider value={true}>
        <NarrowBarContext.Provider value={true}>
          <HeaderMenu label="New…" icon={icons.add} items={items}/>
          <HeaderMenu label="Edit" items={items}/>
        </NarrowBarContext.Provider>
      </InBarContext.Provider>,
    );
    // The label stays the accessible name.
    expect(dom.getByRole('button', {name: 'New…'})).toHaveClass('ui-button--icon-only');
    expect(dom.getByRole('button', {name: 'Edit'})).not.toHaveClass('ui-button--icon-only');
  });

  it('takes the label tone, hides the label and disables', () => {
    renderDom(inHeader(<HeaderMenu label="New" icon={icons.add} items={items} tone="label" hideLabel disabled/>));
    const trigger = dom.getByRole('button', {name: 'New'});
    expect(trigger).toHaveClass('ui-button--label', 'ui-button--icon-only');
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
  });

  it('sends itself to the header from the screen it is rendered in', async () => {
    await renderApp(app(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>));
    const trigger = dom.getByRole('button', {name: 'New…'});
    // In the header row, after the title and before the screen's content.
    const title = dom.getByText('Drops');
    const content = dom.getByText('Home screen');
    expect(title.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(trigger.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(trigger).toHaveClass('ui-button--medium');
    expect(dom.getAllByRole('menuitem', {hidden: true})).toHaveLength(2);
  });
});
