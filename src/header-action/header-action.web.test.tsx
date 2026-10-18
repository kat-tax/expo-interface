import type {ReactNode} from 'react';
import {Text} from 'react-native';
import {fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {InHeaderContext} from '../header/shared';
import {TabStack} from '../tab-stack';
import {InBarContext, NarrowBarContext} from '../tabs/context';
import {renderApp} from 'expo-vitest/router';
import {HeaderAction} from '.';

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

describe('HeaderAction (web)', () => {
  it('renders the header-sized text button and reports the press', () => {
    const onPress = vi.fn();
    renderDom(inHeader(<HeaderAction label="Copy" icon={icons.share} onPress={onPress} testID="copy"/>));
    const trigger = dom.getByRole('button', {name: 'Copy'});
    expect(trigger).toHaveClass('ui-button--text', 'ui-button--medium');
    expect(trigger).toHaveAttribute('data-testid', 'copy');
    // No menu comes with it: this is the trigger on its own.
    expect(dom.queryByRole('menu', {hidden: true})).toBeNull();
    fireDom.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('drops to the bar size when it is folded into the web tab bar', () => {
    renderDom(
      <InBarContext.Provider value={true}>
        <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()}/>
      </InBarContext.Provider>,
    );
    // The bar is the height of its tabs; a header-sized button would grow it.
    const trigger = dom.getByRole('button', {name: 'Copy'});
    expect(trigger).toHaveClass('ui-button--small');
    expect(trigger).not.toHaveClass('ui-button--medium');
  });

  it('shows the icon alone in a bar too narrow for labels, unless it has none', () => {
    renderDom(
      <InBarContext.Provider value={true}>
        <NarrowBarContext.Provider value={true}>
          <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()}/>
          <HeaderAction label="Save" onPress={vi.fn()}/>
        </NarrowBarContext.Provider>
      </InBarContext.Provider>,
    );
    expect(dom.getByRole('button', {name: 'Copy'})).toHaveClass('ui-button--icon-only');
    expect(dom.getByRole('button', {name: 'Save'})).not.toHaveClass('ui-button--icon-only');
  });

  it('takes the label tone, hides the label and does not press while disabled', () => {
    const onPress = vi.fn();
    renderDom(inHeader(<HeaderAction label="Copy" icon={icons.share} onPress={onPress} tone="label" hideLabel disabled/>));
    const trigger = dom.getByRole('button', {name: 'Copy'});
    expect(trigger).toHaveClass('ui-button--label', 'ui-button--icon-only');
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    fireDom.click(trigger);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('sends itself to the header from the screen it is rendered in', async () => {
    const onPress = vi.fn();
    await renderApp(app(<HeaderAction label="Copy" icon={icons.share} onPress={onPress} testID="copy"/>));
    const trigger = dom.getByRole('button', {name: 'Copy'});
    // In the header row, after the title and before the screen's content.
    const title = dom.getByText('Drops');
    const content = dom.getByText('Home screen');
    expect(title.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(trigger.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(trigger).toHaveClass('ui-button--medium');
    fireDom.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
