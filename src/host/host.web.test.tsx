import {render as renderDom, screen as dom} from '@testing-library/react';
import {Switch} from '../switch';
import {NativeHost} from '.';

describe('NativeHost (web)', () => {
  it('renders a view carrying the @expo/ui palette around its content', () => {
    renderDom(
      <NativeHost fit>
        <Switch label="Wi-Fi" value onValueChange={() => {}}/>
      </NativeHost>,
    );
    // The label sits in its column, in the switch's row, in the host.
    const hostView = dom.getByText('Wi-Fi').parentElement!.parentElement!.parentElement!;
    expect(hostView.style.getPropertyValue('--expo-ui-primary-500')).not.toBe('');
    expect(dom.getByRole('switch')).toBeTruthy();
  });

  it('hugs its content by size, leaving the alignment to the row it is in', () => {
    const {container} = renderDom(<NativeHost fit/>);
    const style = getComputedStyle(container.firstElementChild!);
    // The universal host hugs with `align-self: flex-start`, which also
    // pins it to the top of a row that centres its children — where iOS and
    // Android centre it. A definite cross size hugs without saying where:
    // measured in Chromium, this sits at y 15..42 of a 56-high centred row
    // where `flex-start` sat at 0..27, and is still unstretched (0..27,
    // 27 high) in a row with no alignment of its own.
    expect(style.alignSelf).toBe('auto');
    expect(style.width).toBe('fit-content');
    expect(style.height).toBe('fit-content');
  });

  it('fills its container across the axis it does not hug', () => {
    const {container} = renderDom(<NativeHost/>);
    // Without `fit` the host is a block, as it is natively, so the universal
    // host's hug has to be undone rather than replaced.
    expect(getComputedStyle(container.firstElementChild!).alignSelf).toBe('stretch');
  });

  it('lets a caller place it themselves', () => {
    const {container} = renderDom(<NativeHost fit style={{alignSelf: 'flex-end'}}/>);
    expect(getComputedStyle(container.firstElementChild!).alignSelf).toBe('flex-end');
  });

  it('hugs its width alone with fit="width", the height being the row\'s', () => {
    const {container} = renderDom(<NativeHost fit="width"/>);
    const style = getComputedStyle(container.firstElementChild!);
    expect(style.width).toBe('fit-content');
    expect(style.alignSelf).toBe('stretch');
  });

  it('takes the size its layout gives on both axes with fit="fill", for content that scrolls', () => {
    const {container} = renderDom(<NativeHost fit="fill"/>);
    const style = getComputedStyle(container.firstElementChild!);
    expect(style.flexGrow).toBe('1');
    expect(style.alignSelf).toBe('stretch');
    expect(style.width).not.toBe('fit-content');
  });

  it('lays its children out as one row or column when asked', () => {
    const {container} = renderDom(
      <NativeHost direction="row" spacing={8}>
        <span>A</span>
        <span>B</span>
      </NativeHost>,
    );
    const row = container.querySelector('span')!.parentElement!;
    expect(getComputedStyle(row).flexDirection).toBe('row');
    expect(getComputedStyle(row).gap).toBe('8px');
  });
});
