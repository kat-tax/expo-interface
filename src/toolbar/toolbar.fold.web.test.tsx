import {act, render, screen} from '@testing-library/react';
import {Text} from 'react-native';
import {Toolbar} from '.';

/**
 * react-native-web fires `onLayout` from one `ResizeObserver`, made with the
 * first view that has a handler, and observes a view only from its mount:
 * a handler that arrives later is never observed. jsdom has no observer, so
 * this one records what is observed and lets a test report a size.
 */
const observed: Element[] = [];
let report: ((entries: {target: Element}[]) => void) | undefined;
class ResizeObserverStub {
  constructor(callback: typeof report) {
    report = callback;
  }
  observe(node: Element) {
    observed.push(node);
  }
  unobserve() {}
  disconnect() {}
}
// react-native-web reads the constructor from `window`, not `globalThis`.
Object.assign(window, {ResizeObserver: ResizeObserverStub});
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

/** Lays the bar out at a width: `UIManager.measure` reads the offset metrics in a timeout. */
const layout = async (element: Element, width: number) => {
  for (const [key, value] of Object.entries({offsetWidth: width, offsetHeight: 48, offsetLeft: 0, offsetTop: 0})) {
    Object.defineProperty(element, key, {configurable: true, value});
  }
  await act(async () => {
    report?.([{target: element}]);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

const commands = [{label: 'Bold'}, {label: 'Italic'}];
const fieldCommands = [{label: 'Next match'}];
const bar = (fold: boolean) => <Toolbar commands={commands} field={<Text>Find</Text>} fieldCommands={fieldCommands} foldCommands={fold} testID="bar"/>;

describe('Toolbar folding (web)', () => {
  it('observes the bar from its mount, so a fold turned on once it is narrow folds at once', async () => {
    const {rerender} = render(bar(false));
    const element = screen.getByTestId('bar');
    expect(observed).toContain(element);
    await layout(element, 390);
    // Narrow, but not folding: the commands stay on the bar.
    expect(screen.getByRole('button', {name: 'Bold'})).toBeInTheDocument();
    rerender(bar(true));
    expect(screen.queryByRole('button', {name: 'Bold'})).toBeNull();
    expect(screen.getByRole('button', {name: 'More'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next match'})).toBeInTheDocument();
  });

  it('mounts no group for a side with nothing to draw, so the field takes its room', async () => {
    // The row holding the groups and the field: what is in it besides the field is a group.
    const groups = () => screen.getByText('Find').parentElement!.parentElement!.childElementCount - 1;
    const {rerender} = render(<Toolbar commands={commands} field={<Text>Find</Text>} testID="bar"/>);
    // No field commands and nothing secondary: the leading group alone.
    expect(groups()).toBe(1);
    expect(screen.getByRole('button', {name: 'Bold'})).toBeInTheDocument();
    rerender(<Toolbar commands={commands} field={<Text>Find</Text>} foldCommands testID="bar"/>);
    await layout(screen.getByTestId('bar'), 390);
    // Folded: the overflow's group alone.
    expect(groups()).toBe(1);
    expect(screen.queryByRole('button', {name: 'Bold'})).toBeNull();
    expect(screen.getByRole('button', {name: 'More'})).toBeInTheDocument();
    // Folded with nothing behind the overflow: no group at all.
    rerender(<Toolbar commands={[{label: 'Recent', items: []}]} field={<Text>Find</Text>} foldCommands testID="bar"/>);
    expect(groups()).toBe(0);
    expect(screen.queryByRole('button')).toBeNull();
    // The field's commands keep their group, and folded, the overflow joins them in it.
    rerender(bar(true));
    expect(groups()).toBe(1);
    expect(screen.getByRole('button', {name: 'Next match'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'More'})).toBeInTheDocument();
    // Unfolded: the commands' group and the field's commands' group.
    rerender(bar(false));
    expect(groups()).toBe(2);
    expect(screen.getByRole('button', {name: 'Bold'})).toBeInTheDocument();
  });
});
