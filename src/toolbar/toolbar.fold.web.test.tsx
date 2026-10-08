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
});
