import {fireEvent, render, screen} from '@testing-library/react-native';
import {fireIsland, island} from '../__tests__/windows';
import {ColorPicker} from '.';

const PICKER = 'ExpoInterfaceColorPicker';

describe('ColorPicker (windows)', () => {
  it('renders the well island after the label with the value and alpha', async () => {
    await render(<ColorPicker label="Accent" value="#FF9500" onValueChange={vi.fn()} testID="accent"/>);
    expect(screen.getByTestId('accent')).toBeOnTheScreen();
    expect(screen.getByText('Accent')).toBeOnTheScreen();
    expect(island(PICKER).props).toMatchObject({value: '#FF9500FF', alpha: true, label: 'Accent'});
  });

  it('reports a pick in the format the opacity setting asks for', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPicker value="#FF9500" onValueChange={onValueChange} supportsOpacity={false}/>);
    expect(island(PICKER).props.alpha).toBe(false);
    expect(island(PICKER).props.label).toBe('Color');
    await fireIsland(island(PICKER), 'valueChange', {value: '#11223380'});
    expect(onValueChange).toHaveBeenCalledWith('#112233');
  });

  it('draws preset swatches, rings the selected one and picks from them', async () => {
    const onValueChange = vi.fn();
    await render(
      <ColorPicker label="Accent" value="#FF9500" onValueChange={onValueChange} swatches={['#FF9500', '#8959EA']} disabled/>,
    );
    const orange = screen.getByLabelText('Color #FF9500');
    const purple = screen.getByLabelText('Color #8959EA');
    expect(orange.props['aria-pressed']).toBe(true);
    expect(purple.props['aria-pressed']).toBe(false);
    expect(orange).toHaveStyle({borderColor: '#000000'});
    expect(purple).toHaveStyle({borderColor: 'transparent'});
    expect(island(PICKER).props.disabled).toBe(true);
    expect(screen.getByText('Accent')).toHaveStyle({opacity: 0.4});
    await fireEvent.press(purple);
    // Disabled: the press is ignored.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('picks a preset while enabled', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPicker value="#FF9500" onValueChange={onValueChange} swatches={['#8959EA']}/>);
    await fireEvent.press(screen.getByLabelText('Color #8959EA'));
    expect(onValueChange).toHaveBeenCalledWith('#8959EAFF');
  });
});
