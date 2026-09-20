import {Platform, Text} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {iosSymbol} from '../button/shared';
import {host} from '../__tests__/native';
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

    it('puts an action underneath, because the native view takes no children', async () => {
      await render(<EmptyState title="No drops" action={<Text>New drop</Text>} testID="empty"/>);
      expect(screen.getByText('New drop')).toBeOnTheScreen();
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

  it('draws the column on Android, where no single control exists for it', async () => {
    await render(<EmptyState title="No drops yet" description="Nothing shared." icon={icons.add} testID="empty"/>);
    expect(screen.getByTestId('empty').props.accessibilityLabel).toBe('No drops yet. Nothing shared.');
    expect(screen.getByText('No drops yet')).toBeOnTheScreen();
    expect(screen.getByText('Nothing shared.')).toBeOnTheScreen();
  });

  it('needs nothing but a title, and takes an action under it', async () => {
    await render(<EmptyState title="Nothing here" testID="bare"/>);
    expect(screen.getByTestId('bare').props.accessibilityLabel).toBe('Nothing here');
    expect(screen.queryByText('Nothing shared.')).toBeNull();
    await render(<EmptyState title="No drops" action={<Text>New drop</Text>} testID="acting"/>);
    expect(screen.getByText('New drop')).toBeOnTheScreen();
  });
});
