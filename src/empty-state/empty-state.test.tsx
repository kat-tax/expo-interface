import {Dimensions, Platform, StyleSheet, Text} from 'react-native';
import {fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {hostFit, hosts} from '../__tests__/hosts';
import {iosSymbol} from '../button/shared';
import {NativeHost, useNativeHost} from '../host';
import {colors, spacing} from '../theme';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {EMPTY_ICON} from './shared';
import {EmptyState} from '.';

const isIOS = Platform.OS === 'ios';

/** Says whether it sits below a host, as a kit control placed there would see it. */
function Hosted() {
  return <Text>{useNativeHost() ? 'hosted' : 'bare'}</Text>;
}

describe(`EmptyState (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('draws the column, and reads as one thing rather than three loose lines', () => {
      renderDom(
        <EmptyState title="No drops yet" description="Anything you share shows up here." icon={icons.add} testID="empty"/>,
      );
      expect(dom.getByText('No drops yet')).toBeInTheDocument();
      expect(dom.getByText('Anything you share shows up here.')).toBeInTheDocument();
      expect(dom.getByLabelText('No drops yet. Anything you share shows up here.')).toBeInTheDocument();
    });

    it('needs nothing but a title, and puts an action under the description', () => {
      renderDom(<EmptyState title="Nothing here" testID="bare"/>);
      expect(dom.getByLabelText('Nothing here')).toBeInTheDocument();
      renderDom(<EmptyState title="No drops" action={<button type="button">New drop</button>} testID="acting"/>);
      expect(dom.getByRole('button', {name: 'New drop'})).toBeInTheDocument();
    });

    it('draws an action given as data as the kit\'s button, and spins while loading', () => {
      const onPress = vi.fn();
      renderDom(<EmptyState title="No drops" action={{label: 'New drop', onPress, variant: 'outlined'}} testID="acting"/>);
      const button = dom.getByRole('button', {name: 'New drop'});
      expect(button).toHaveClass('ui-button--outlined');
      fireDom.click(button);
      expect(onPress).toHaveBeenCalledTimes(1);
      renderDom(<EmptyState title="No files" action={{label: 'Add one'}}/>);
      expect(dom.getByRole('button', {name: 'Add one'})).not.toHaveAttribute('data-testid');
      renderDom(<EmptyState title="Opening" description="One moment." loading icon={icons.add} testID="busy"/>);
      expect(dom.getByTestId('busy').querySelector('.ui-progress-ring--indeterminate')).toBeTruthy();
      expect(dom.getByTestId('busy').querySelector('.ui-symbol')).toBeNull();
    });

    it('lets the description be selected, unless told not to', () => {
      renderDom(<EmptyState title="Failed" description="The file is gone." testID="failed"/>);
      expect(dom.getByText('The file is gone.').style.userSelect).toBe('text');
      renderDom(<EmptyState title="Failed" description="No reason." selectable={false} testID="plain"/>);
      expect(dom.getByText('No reason.').style.userSelect).toBe('');
    });
    return;
  }

  if (isIOS) {
    it('hosts the system ContentUnavailableView on iOS 17 and later', async () => {
      await render(<EmptyState title="No drops yet" description="Nothing shared." icon={icons.add} testID="empty"/>);
      // The native view carries the strings; the kit draws no text of its own.
      const view = host(props => props.title === 'No drops yet');
      expect(view.props).toMatchObject({title: 'No drops yet', description: 'Nothing shared.'});
      expect(view.props.systemImage).toBe(iosSymbol(icons.add));
    });

    it('puts an action of the app\'s own underneath, because the native view takes no children', async () => {
      await render(<EmptyState title="No drops" action={<Text>New drop</Text>} testID="empty"/>);
      expect(screen.getByText('New drop')).toBeOnTheScreen();
      expect(nodes().some(n => n.props.label === 'New drop')).toBe(false);
    });

    it('draws an action given as data as the kit\'s button in the view\'s own host, which fills the width', async () => {
      const onPress = vi.fn();
      await render(<EmptyState title="No drops" description="Nothing shared." action={{label: 'New drop', onPress}} testID="empty"/>);
      expect(hosts()).toHaveLength(1);
      // The width of the screen, so the description wraps at it rather than at the text's own.
      expect(hostFit(hosts()[0])).toEqual({vertical: true});
      const button = host(p => p.label === 'New drop');
      expect(modifier(button.props, 'buttonStyle')?.style).toBe('borderedProminent');
      await fireEvent.press(screen.container.queryAll(i => i.props.label === 'New drop')[0]);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('lets the description be selected, unless told not to', async () => {
      await render(
        <>
          <EmptyState title="Failed" description="The file is gone." testID="a"/>
          <EmptyState title="Failed" description="No reason." selectable={false} testID="b"/>
        </>,
      );
      expect(modifier(host(p => p.description === 'The file is gone.').props, 'textSelection')).toEqual({$type: 'textSelection', value: true});
      expect(modifier(host(p => p.description === 'No reason.').props, 'textSelection')).toEqual({$type: 'textSelection', value: false});
    });

    it('composes the same layout by hand while loading, padded and filling, with the spinner in the symbol\'s place', async () => {
      await render(<EmptyState title="Opening" description="One moment." icon={icons.add} loading testID="busy"/>);
      expect(nodes().some(n => n.props.title === 'Opening')).toBe(false);
      // The system view's standard inset, and as greedy as the system view, so
      // the state does not move when loading ends.
      const stack = nodes().find(n => n.type.includes('VStack') && modifier(n.props, 'padding'))!;
      expect(modifier(stack.props, 'padding')).toEqual({$type: 'padding', all: 'default'});
      expect(modifier(stack.props, 'frame')).toMatchObject({maxWidth: Infinity, maxHeight: Infinity});
      const spinner = nodes().find(n => n.type.includes('ProgressView'))!;
      expect(modifier(spinner.props, 'frame')).toMatchObject({width: EMPTY_ICON, height: EMPTY_ICON});
      expect(modifier(host(p => p.text === 'Opening').props, 'font')).toMatchObject({textStyle: 'title2', weight: 'bold'});
      expect(modifier(host(p => p.text === 'One moment.').props, 'foregroundStyle')?.style.color).toBe(colors.light.secondaryLabel);
      await render(<EmptyState title="Opening" loading testID="bare"/>);
      expect(nodes().some(n => n.props.text === 'One moment.')).toBe(false);
    });

    it('renders bare inside a host, the test ID on the native stack', async () => {
      await render(
        <NativeHost>
          <EmptyState title="No drops" description="Nothing shared." action={{label: 'New drop'}} testID="empty"/>
        </NativeHost>,
      );
      // One host: the one around it, not a second nested inside.
      expect(hosts()).toHaveLength(1);
      expect(host(p => p.testID === 'empty').type).toContain('VStack');
      expect(host(p => p.title === 'No drops')).toBeTruthy();
      expect(host(p => p.label === 'New drop')).toBeTruthy();
      await render(<NativeHost><EmptyState title="Nothing here"/></NativeHost>);
      expect(hosts()).toHaveLength(1);
      expect(host(p => p.title === 'Nothing here')).toBeTruthy();
    });

    it('hosts a node of the app\'s own in the stack inside a host, outside the host\'s context', async () => {
      await render(<NativeHost><EmptyState title="No drops" action={<Hosted/>}/></NativeHost>);
      expect(hosts()).toHaveLength(1);
      expect(host(p => p.matchContents === true)).toBeTruthy();
      // A kit control in the node mounts a host of its own, since it is React Native again.
      expect(screen.getByText('bare')).toBeOnTheScreen();
    });

    it('composes the same layout in SwiftUI on iOS 16, where ContentUnavailableView does not exist', async () => {
      // SUPPORTED is read once when the module loads, so the version has to be
      // in place before the import rather than before the render.
      vi.resetModules();
      vi.doMock('react-native', async importOriginal => {
        const actual = await importOriginal<typeof import('react-native')>();
        return {...actual, Platform: {...actual.Platform, Version: '16.4'}};
      });
      const {EmptyState: Old} = await import('.');
      await render(<Old title="No drops yet" description="Nothing shared." icon={icons.add} testID="old"/>);
      expect(nodes().some(n => n.type.includes('ContentUnavailableView'))).toBe(false);
      // The symbol as an SF Symbol image, in the size the other platforms give the icon.
      expect(modifier(host(p => p.systemName === iosSymbol(icons.add)).props, 'font')).toMatchObject({size: EMPTY_ICON});
      expect(host(p => p.text === 'No drops yet')).toBeTruthy();
      // Native through and through: one host, and no React Native drawn inside it.
      expect(hosts()).toHaveLength(1);
      expect(screen.getByTestId('old')).toBeOnTheScreen();
      await render(<Old title="Nothing here"/>);
      expect(nodes().some(n => n.type.endsWith('ImageView'))).toBe(false);
      vi.doUnmock('react-native');
      vi.resetModules();
    });
    return;
  }

  it('composes the column in Compose, in one host, with a data action as the kit\'s button', async () => {
    const onPress = vi.fn();
    await render(
      <EmptyState title="No drops yet" description="Nothing shared." icon={icons.add} action={{label: 'New drop', onPress}} testID="empty"/>,
    );
    expect(hosts()).toHaveLength(1);
    const column = nodes().find(n => n.type.includes('Column'))!;
    expect(column.props.horizontalAlignment).toBe('center');
    expect(host(p => p.text === 'No drops yet').props.color).toBe(colors.light.label);
    // Selectable by default, so the description is React Native text hosted in the column.
    const description = screen.getByText('Nothing shared.');
    expect(description.props.selectable).toBe(true);
    expect(StyleSheet.flatten(description.props.style)).toMatchObject({textAlign: 'center', color: colors.light.secondaryLabel});
    expect(nodes().some(n => n.type.endsWith('IconView') && n.props.size === 48)).toBe(true);
    const button = host(p => typeof p.onButtonPressed === 'function');
    expect(host(p => p.text === 'New drop', button)).toBeTruthy();
    await fireEvent(screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function')[0], 'buttonPressed');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('needs nothing but a title, spins while loading, and hosts a node of the app\'s own as the action', async () => {
    await render(<EmptyState title="Nothing here" testID="bare"/>);
    expect(host(p => p.text === 'Nothing here')).toBeTruthy();
    expect(nodes().some(n => n.type.endsWith('IconView'))).toBe(false);
    await render(<EmptyState title="Opening" icon={icons.add} loading action={<Text>Cancel</Text>} testID="busy"/>);
    expect(nodes().some(n => n.type.includes('CircularProgressIndicator'))).toBe(true);
    expect(nodes().some(n => n.type.endsWith('IconView'))).toBe(false);
    // React Native content rides in the column through an RNHostView.
    expect(host(p => p.matchContents === true)).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeOnTheScreen();
    // Outside the host's context, so a kit control in the node mounts a host of its own.
    await render(<NativeHost><EmptyState title="Opening" action={<Hosted/>}/></NativeHost>);
    expect(screen.getByText('bare')).toBeOnTheScreen();
  });

  it('lets the description be selected as hosted React Native text at the column\'s width, unless told not to', async () => {
    await render(
      <>
        <EmptyState title="Failed" description="The file is gone." testID="a"/>
        <EmptyState title="Failed" description="No reason." selectable={false} testID="b"/>
      </>,
    );
    const width = () => StyleSheet.flatten(screen.getByText('The file is gone.').props.style).width;
    // Until Compose has measured the column: the window's width less the column's padding.
    expect(width()).toBe(Dimensions.get('window').width - spacing.five * 2);
    const box = nodes().find(n => n.type.endsWith('BoxView') && modifier(n.props, 'onSizeChanged'))!;
    await act(async () => modifier(box.props, 'onSizeChanged')!.eventListener({width: 280, height: 40}));
    expect(width()).toBe(280);
    // Not selectable: the Compose text, with no React Native text beside it.
    expect(host(p => p.text === 'No reason.').props.textAlign).toBe('center');
    expect(screen.queryByText('No reason.')).toBeNull();
  });

  it('renders bare inside a host, the test ID on the column', async () => {
    await render(<NativeHost><EmptyState title="No drops" testID="empty"/></NativeHost>);
    // One host: the one around it, not a second nested inside.
    expect(hosts()).toHaveLength(1);
    expect(byComposeTestID('empty').type).toContain('Column');
  });
});
