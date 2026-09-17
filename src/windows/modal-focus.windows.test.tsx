import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {LayerHost} from './layer';
import {ModalLayer} from './modal-layer';

// A renderer without react-native-windows' focus command: the modal opens all the same.
vi.mock('react-native/Libraries/Utilities/codegenNativeCommands', () => ({
  default: () => ({
    focus: () => {
      throw new Error('no focus command here');
    },
  }),
}));

describe('ModalLayer focus (windows)', () => {
  it('opens without the focus command, leaving the focus where it is', async () => {
    await render(<ModalLayer testID="modal"><Text>Form</Text></ModalLayer>);
    expect(screen.getByText('Form')).toBeOnTheScreen();
    expect(screen.getByTestId('modal').props.focusable).toBe(true);
  });
});

describe('LayerHost focus (windows)', () => {
  it('mounts a root host without the focus command, leaving the focus where it is', async () => {
    await render(<LayerHost takesFocus testID="host"><Text>Content</Text></LayerHost>);
    expect(screen.getByText('Content')).toBeOnTheScreen();
    expect(screen.getByTestId('host').props.focusable).toBe(true);
  });
});
