import {render, screen} from '@testing-library/react-native';
import {modifier} from 'expo-vitest/native';
import {TextField} from '.';

const label = (testID: string) => modifier(screen.getByTestId(testID).props, 'accessibilityLabel');

describe('TextField (ios)', () => {
  it('names the SwiftUI field by its placeholder, which stays its name once it holds text', async () => {
    await render(
      <>
        <TextField placeholder="Email" value="ada@example.com" testID="email"/>
        <TextField placeholder="Password" value="hunter22" secureTextEntry testID="password"/>
        <TextField placeholder="Notes" multiline testID="notes"/>
      </>,
    );
    expect(label('email')).toEqual({$type: 'accessibilityLabel', label: 'Email'});
    // The placeholder is still drawn as the empty field's prompt.
    expect(screen.getByTestId('email').props.placeholder).toBe('Email');
    expect(label('password')?.label).toBe('Password');
    expect(screen.getByTestId('password').props.axis).toBeUndefined();
    expect(label('notes')?.label).toBe('Notes');
  });

  it('gives a field without a placeholder no label', async () => {
    await render(
      <>
        <TextField value="draft" testID="bare"/>
        <TextField placeholder="" secureTextEntry testID="empty"/>
      </>,
    );
    expect(label('bare')).toBeUndefined();
    expect(label('empty')).toBeUndefined();
  });
});
