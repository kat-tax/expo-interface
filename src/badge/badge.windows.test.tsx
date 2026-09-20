import {StyleSheet} from 'react-native';
import {render} from '@testing-library/react-native';
import {island} from 'expo-vitest/windows';
import {Badge} from '.';

const BADGE = 'ExpoInterfaceInfoBadge';

describe('Badge (windows)', () => {
  it('renders an InfoBadge island holding the number, sized before XAML has measured anything', async () => {
    await render(<Badge count={3} testID="unread"/>);
    expect(island(BADGE).props).toMatchObject({
      value: 3,
      label: '3 new',
      theme: 'light',
      testID: 'unread',
    });
    expect(StyleSheet.flatten(island(BADGE).props.style)).toMatchObject({minWidth: 16, height: 16});
  });

  it('clamps an overflowing count, because InfoBadge holds a number and cannot draw a plus', async () => {
    await render(<Badge count={150}/>);
    // The number is what the control can show; the label is what is true.
    expect(island(BADGE).props).toMatchObject({value: 99, label: '99+ new'});
  });

  it('asks for the dot form with a negative value, and for the dot size', async () => {
    await render(<Badge dot label="Unsaved"/>);
    expect(island(BADGE).props).toMatchObject({value: -1, label: 'Unsaved'});
    expect(StyleSheet.flatten(island(BADGE).props.style)).toMatchObject({minWidth: 8, height: 8});
  });

  it('passes its colors straight through, and leaves them to the control when there are none', async () => {
    await render(<Badge count={1} color="#0A84FF" textColor="#000000"/>);
    expect(island(BADGE).props).toMatchObject({color: '#0A84FF', textColor: '#000000'});
    await render(<Badge count={1}/>);
    expect(island(BADGE).props.color).toBeUndefined();
  });

  it('draws nothing for a count of zero', async () => {
    const {toJSON} = await render(<Badge count={0}/>);
    expect(toJSON()).toBeNull();
  });
});
