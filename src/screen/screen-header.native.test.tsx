import {Platform, StyleSheet, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {bound, colors} from '../theme';
import {nodes} from '../__tests__/native';
import {ScreenHeader} from './header';

const metrics = {
  insets: {top: 47, left: 0, right: 0, bottom: 34},
  frame: {x: 0, y: 0, width: 390, height: 844},
};

function mount(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);
}

/** Flattened styles of the header bar (first view under the provider) and its inner row. */
function styles() {
  const [, bar, inner] = nodes();
  return {bar: StyleSheet.flatten(bar.props.style), inner: StyleSheet.flatten(inner.props.style)};
}

describe(`ScreenHeader (${Platform.OS})`, () => {
  it('renders the title on a single line', async () => {
    await mount(<ScreenHeader title="Settings"/>);
    const title = screen.getByText('Settings');
    expect(title).toBeOnTheScreen();
    expect(title.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(title.props.style).color).toBe(colors.light.label);
  });

  it('shows the back button only with onBack', async () => {
    await mount(<ScreenHeader title="Settings"/>);
    expect(screen.queryByLabelText('Go back')).toBeNull();

    const onBack = vi.fn();
    await mount(<ScreenHeader title="Settings" onBack={onBack}/>);
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders the trailing slot', async () => {
    await mount(<ScreenHeader title="Settings" trailing={<Text testID="done">Done</Text>}/>);
    expect(screen.getByTestId('done')).toBeOnTheScreen();
  });

  it('pads the bar by the top safe-area inset and constrains the row', async () => {
    await mount(<ScreenHeader title="Settings"/>);
    const {bar, inner} = styles();
    expect(bar.paddingTop).toBe(metrics.insets.top);
    expect(bar.backgroundColor).toBe(colors.light.background);
    expect(inner.maxWidth).toBe(bound.contentMaxWidth);
  });
});
