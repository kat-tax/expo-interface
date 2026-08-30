import {fireEvent, render, screen} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Button} from '../button';
import {bound} from '../theme';
import {ScreenHeader} from './header';

function mount(ui: React.ReactElement) {
  return render(<SafeAreaProvider>{ui}</SafeAreaProvider>);
}

describe('ScreenHeader (web)', () => {
  it('renders the title inside a constrained row', () => {
    mount(<ScreenHeader title="Settings"/>);
    const title = screen.getByText('Settings');
    expect(getComputedStyle(title.parentElement!).maxWidth).toBe(`${bound.contentMaxWidth}px`);
  });

  it('shows the back button only with onBack', () => {
    mount(<ScreenHeader title="Settings"/>);
    expect(screen.queryByLabelText('Go back')).toBeNull();

    const onBack = vi.fn();
    mount(<ScreenHeader title="Settings" onBack={onBack}/>);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders the trailing slot', () => {
    mount(<ScreenHeader title="Settings" trailing={<Button label="Done"/>}/>);
    expect(screen.getByRole('button', {name: 'Done'})).toBeInTheDocument();
  });

  it('applies no safe-area padding on web', () => {
    mount(<ScreenHeader title="Settings"/>);
    const bar = screen.getByText('Settings').parentElement!.parentElement!;
    expect(getComputedStyle(bar).paddingTop).toBe('0px');
  });
});
