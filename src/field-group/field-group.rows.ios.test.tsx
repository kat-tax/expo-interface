import type {HostNode} from 'expo-vitest/native';
import type {ReactElement} from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HStack} from '@expo/ui/swift-ui';
import {modifier, nodes} from 'expo-vitest/native';
import {Button} from '../button';
import {NativeHostContext} from '../host';
import {ListItem} from '../list-item';
import {FieldGroup} from '.';

/** Renders under a host, where the form is bare native content. */
const render_ = (ui: ReactElement) => render(<NativeHostContext.Provider value={true}>{ui}</NativeHostContext.Provider>);

/** The SwiftUI button matched by `match`, and the host view it stands in, from one snapshot of the tree. */
function standing(match: (props: Record<string, any>) => boolean): {button: HostNode; parent: HostNode} {
  const all = nodes(screen.toJSON());
  const button = all.find(n => n.type === 'ViewManagerAdapter_ExpoUI_Button' && match(n.props ?? {}))!;
  return {button, parent: all.find(n => n.children?.includes(button))!};
}

const byTestID = (testID: string) => (props: Record<string, any>) => props.testID === testID;

/** The stack's tap, as SwiftUI reports it through the view's global event. */
const tap = (stack: HostNode) => act(async () => stack.props.onGlobalEvent({nativeEvent: {onTapGesture: {}}}));

/** A component of the app's own that renders a kit button. */
function SignIn({onPress}: {onPress: () => void}) {
  return <Button label="Sign in" onPress={onPress} testID="own"/>;
}

describe('FieldGroup rows (ios)', () => {
  it('lets a button that is a row of its own take a tap anywhere along the row', async () => {
    const onPress = vi.fn();
    await render_(
      <FieldGroup>
        <FieldGroup.Section title="Account">
          <Button label="Sign in" onPress={onPress} testID="sign-in"/>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const {button, parent: stack} = standing(byTestID('sign-in'));
    // A stack the row's width: the button at its leading edge, then a spacer
    // that may shrink to nothing, so a long label wraps where it did.
    expect(stack.type).toBe('ViewManagerAdapter_ExpoUI_HStackView');
    expect(stack.props.spacing).toBe(0);
    expect(stack.children).toHaveLength(2);
    expect(stack.children![1]).toMatchObject({type: 'ViewManagerAdapter_ExpoUI_SpacerView', props: {minLength: 0}});
    expect(stack.props.modifiers.map((m: {$type: string}) => m.$type)).toEqual(['contentShape', 'onTapGesture']);
    expect(modifier(stack.props, 'contentShape')).toMatchObject({shape: 'rectangle'});
    // The button is drawn as anywhere else: its own style, nothing stretching it.
    expect(modifier(button.props, 'buttonStyle')?.style).toBe('borderedProminent');
    expect(modifier(button.props, 'frame')).toBeUndefined();

    await tap(stack);
    expect(onPress).toHaveBeenCalledTimes(1);
    // A tap on the button itself is the button's.
    await fireEvent(screen.getByTestId('sign-in'), 'buttonPress');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('does the same for a loose row of the group, in a fragment or not', async () => {
    const onPress = vi.fn();
    await render_(
      <FieldGroup>
        <Button label="Create an account" variant="text" onPress={onPress} testID="loose"/>
        <>
          <Button label="Forgot your password?" variant="text" onPress={onPress} testID="fragment"/>
        </>
      </FieldGroup>,
    );
    for (const testID of ['loose', 'fragment']) {
      const {button, parent} = standing(byTestID(testID));
      expect(modifier(button.props, 'buttonStyle')?.style).toBe('plain');
      expect(modifier(parent.props, 'contentShape')).toMatchObject({shape: 'rectangle'});
      await tap(parent);
    }
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('takes no tap along the row while the button cannot be pressed', async () => {
    await render_(
      <FieldGroup>
        <FieldGroup.Section>
          <Button label="Sign in" onPress={vi.fn()} disabled testID="disabled"/>
          <Button label="Signing in" onPress={vi.fn()} loading testID="loading"/>
          <Button label="Nothing" testID="press-less"/>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    for (const testID of ['disabled', 'loading', 'press-less']) {
      const {parent} = standing(byTestID(testID));
      // The same stack, so the row is laid out the same; only the tap is gone.
      expect(modifier(parent.props, 'contentShape')).toBeDefined();
      expect(modifier(parent.props, 'onTapGesture')).toBeUndefined();
    }
  });

  it('leaves a button that fills its width, which fills the row already', async () => {
    await render_(
      <FieldGroup>
        <FieldGroup.Section>
          <Button label="Sign in" onPress={vi.fn()} fillWidth testID="wide"/>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const {button, parent} = standing(byTestID('wide'));
    // The section's own slot holds it, and its label stretches across the row.
    expect(parent.props.name).toBe('content');
    const label = button.children![0] as HostNode;
    expect(modifier(label.props, 'frame')).toBeDefined();
    expect(nodes().some(n => modifier(n.props ?? {}, 'onTapGesture') != null)).toBe(false);
  });

  it('leaves a button that is not a row of its own as it is', async () => {
    await render_(
      <FieldGroup>
        <FieldGroup.Section>
          <HStack>
            <Button label="Cancel" onPress={vi.fn()} testID="nested"/>
          </HStack>
          <SignIn onPress={vi.fn()}/>
          <ListItem action={{label: 'Connect', onPress: vi.fn()}}>Server</ListItem>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    for (const match of [byTestID('nested'), byTestID('own'), (p: Record<string, any>) => p.label === 'Connect']) {
      const {parent} = standing(match);
      expect(modifier(parent.props, 'contentShape')).toBeUndefined();
      expect(modifier(parent.props, 'onTapGesture')).toBeUndefined();
    }
    expect(nodes().some(n => modifier(n.props ?? {}, 'onTapGesture') != null)).toBe(false);
  });

  it('leaves a button outside a FieldGroup as it is', async () => {
    await render_(<Button label="Continue" onPress={vi.fn()} testID="alone"/>);
    expect(nodes().some(n => n.type.endsWith('HStackView'))).toBe(false);
    expect(screen.getByTestId('alone')).toBeTruthy();
  });
});
