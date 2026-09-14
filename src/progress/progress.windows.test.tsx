import {render} from '@testing-library/react-native';
import {island} from '../__tests__/windows';
import {Progress} from '.';
import {Spinner} from '../spinner';

const PROGRESS = 'ExpoInterfaceProgress';

describe('Progress (windows)', () => {
  it('renders a stretched ProgressBar island with the clamped value', async () => {
    await render(<Progress value={1.4} testID="upload"/>);
    const bar = island(PROGRESS);
    expect(bar.props).toMatchObject({variant: 'linear', value: 1, size: 24, testID: 'upload', style: {alignSelf: 'stretch'}});
    expect(bar.props.accentColor).toBe('#007AFF');
  });

  it('is indeterminate without a value', async () => {
    await render(<Progress/>);
    expect(island(PROGRESS).props.value).toBe(-1);
  });

  it('renders a ring of the given size and colors for circular', async () => {
    await render(<Progress variant="circular" value={-2} size={40} color="#FF9500" trackColor="#EEEEEE"/>);
    const ring = island(PROGRESS);
    expect(ring.props).toMatchObject({variant: 'circular', value: 0, size: 40, color: '#FF9500', trackColor: '#EEEEEE', style: {alignSelf: 'flex-start'}});
  });

  it('is the spinner too, bare on Windows where everything is hosted', async () => {
    await render(<Spinner size={32} testID="wait"/>);
    expect(island(PROGRESS).props).toMatchObject({variant: 'circular', value: -1, size: 32, testID: 'wait'});
  });
});
