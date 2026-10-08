import {Platform, Text} from 'react-native';
import {fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {hostFit, hosts} from '../__tests__/hosts';
import {iosSymbol} from '../button/shared';
import {colors} from '../theme';
import {host, modifier, nodes} from 'expo-vitest/native';
import {EMPTY_ICON} from './shared';
import {EmptyState} from '.';

const isIOS = Platform.OS === 'ios';

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

    it('draws the column instead on iOS 16, where ContentUnavailableView does not exist', async () => {
      // SUPPORTED is read once when the module loads, so the version has to be
      // in place before the import rather than before the render.
      vi.resetModules();
      vi.doMock('react-native', async importOriginal => {
        const actual = await importOriginal<typeof import('react-native')>();
        return {...actual, Platform: {...actual.Platform, Version: '16.4'}};
      });
      const {EmptyState: Old} = await import('.');
      await render(<Old title="No drops yet" description="Nothing shared." icon={icons.add} testID="old"/>);
      expect(screen.getByText('No drops yet')).toBeOnTheScreen();
      expect(screen.getByTestId('old').props.accessibilityLabel).toBe('No drops yet. Nothing shared.');
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
    expect(host(p => p.text === 'Nothing shared.').props.color).toBe(colors.light.secondaryLabel);
    expect(host(p => p.text === 'Nothing shared.').props.textAlign).toBe('center');
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
  });
});
