import {Platform, StyleSheet} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {render, screen} from '@testing-library/react-native';
import {colorOf} from './shared';
import {Avatar} from '.';

describe(`Avatar (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('draws the initials in a named circle', () => {
      renderDom(<Avatar name="Ada Lovelace" testID="peer"/>);
      expect(dom.getByText('AL')).toBeInTheDocument();
      expect(dom.getByLabelText('Ada Lovelace')).toBeInTheDocument();
    });
    return;
  }

  it('draws the initials in a circle hashed from the name', async () => {
    await render(<Avatar name="Ada Lovelace" testID="peer"/>);
    const circle = screen.getByTestId('peer');
    expect(StyleSheet.flatten(circle.props.style)).toMatchObject({
      backgroundColor: colorOf('Ada Lovelace'),
      width: 28,
      height: 28,
      borderRadius: 14,
    });
    expect(circle.props.accessibilityLabel).toBe('Ada Lovelace');
    expect(screen.getByText('AL')).toBeOnTheScreen();
  });

  it('takes initials, a color and a size of its own, and contrasts the text', async () => {
    await render(<Avatar name="Ada" initials="A1" color="#FFFFFF" size={40} testID="peer"/>);
    expect(StyleSheet.flatten(screen.getByTestId('peer').props.style)).toMatchObject({
      backgroundColor: '#FFFFFF',
      width: 40,
      borderRadius: 20,
    });
    const text = screen.getByText('A1');
    expect(StyleSheet.flatten(text.props.style)).toMatchObject({color: '#000000', fontSize: 16});
  });
});
