import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {PlatformColor, Text, View} from 'react-native';
import {useNativeHost} from '../host';
import {setColorScheme} from '../scheme';
import {StackHeaderContext} from '../stack-header/context';
import {bound, colors, spacing} from '../theme';
import {ScreenHeader} from './header';
import {hostAccentProps} from './host-accent';
import {Screen} from '.';

function Hosted() {
  return <Text>{useNativeHost() ? 'hosted' : 'bare'}</Text>;
}

describe('Screen (windows)', () => {
  afterEach(() => {
    setColorScheme('system');
  });

  it('paints the scheme background and constrains the content width', async () => {
    await render(<Screen><View testID="kid"/></Screen>);
    const content = screen.getByTestId('kid').parent!;
    expect(content).toHaveStyle({maxWidth: bound.contentMaxWidth});
    const root = content.parent!;
    expect(root).toHaveStyle({paddingTop: 0});
    expect(root.parent).toHaveStyle({backgroundColor: colors.light.background});
    expect(content).not.toHaveStyle({paddingHorizontal: spacing.three});
  });

  it('marks native children as hosted, without a host of their own', async () => {
    await render(<Screen native><Hosted/></Screen>);
    expect(screen.getByText('hosted')).toBeOnTheScreen();
    await screen.unmount();
    await render(<Screen><Hosted/></Screen>);
    expect(screen.getByText('bare')).toBeOnTheScreen();
  });

  it('adds a gutter on request and skips the top inset under a header', async () => {
    await render(
      <StackHeaderContext.Provider value={true}>
        <Screen gutter header={false}><View testID="kid"/></Screen>
      </StackHeaderContext.Provider>,
    );
    expect(screen.getByTestId('kid').parent).toHaveStyle({paddingHorizontal: spacing.three});
  });

  it('places the floating action button over the content', async () => {
    await render(<Screen fab={<Text>Add</Text>}><View/></Screen>);
    expect(screen.getByTestId('screen-fab')).toHaveStyle({position: 'absolute', right: spacing.three, bottom: spacing.three});
    expect(screen.getByText('Add')).toBeOnTheScreen();
  });

  it('has no host to seed', () => {
    expect(hostAccentProps('#8959EA')).toEqual({});
  });

  it('follows a forced dark scheme', async () => {
    await render(<Screen><View testID="kid"/></Screen>);
    await act(async () => setColorScheme('dark'));
    expect(screen.getByTestId('kid').parent!.parent!.parent).toHaveStyle({backgroundColor: colors.dark.background});
  });
});

describe('ScreenHeader (windows)', () => {
  it('draws the title, a back arrow and the trailing slot in a 48-point row', async () => {
    const onBack = vi.fn();
    await render(<ScreenHeader title="Drops" onBack={onBack} trailing={<Text>New</Text>}/>);
    expect(screen.getByText('Drops').parent).toHaveStyle({height: 48});
    expect(screen.getByText('')).toBeOnTheScreen();
    expect(screen.getByText('New')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('has no back arrow on a root screen', async () => {
    await render(<ScreenHeader title="Drops"/>);
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });
});

describe('ScreenHeader back button (windows)', () => {
  it('takes the subtle fill under the pointer', async () => {
    await render(<ScreenHeader title="Drops" onBack={vi.fn()}/>);
    const back = screen.getByLabelText('Go back');
    await fireEvent(back, 'hoverIn');
    expect(back).toHaveStyle({backgroundColor: PlatformColor('SubtleFillColorSecondary')});
    await fireEvent(back, 'hoverOut');
    expect(back).not.toHaveStyle({backgroundColor: PlatformColor('SubtleFillColorSecondary')});
  });
});
