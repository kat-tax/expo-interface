import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {NativeHost, useNativeHost} from '.';

function Hosted() {
  return <Text>{useNativeHost() ? 'hosted' : 'bare'}</Text>;
}

describe('NativeHost (windows)', () => {
  it('is a plain view that marks its content as hosted', async () => {
    await render(<NativeHost><Hosted/></NativeHost>);
    expect(screen.getByText('hosted')).toBeOnTheScreen();
    expect(screen.getByText('hosted').parent).toHaveStyle({alignSelf: 'stretch'});
  });

  it('hugs its content with fit and takes a style and pointer events', async () => {
    await render(<NativeHost fit pointerEvents="none" style={{margin: 4}}><Hosted/></NativeHost>);
    expect(screen.getByText('hosted').parent).toHaveStyle({alignSelf: 'flex-start', margin: 4, pointerEvents: 'none'});
  });

  it('reports the laid-out size', async () => {
    const onLayoutContent = vi.fn();
    await render(<NativeHost onLayoutContent={onLayoutContent}><Hosted/></NativeHost>);
    await fireEvent(screen.getByText('hosted').parent!, 'layout', {nativeEvent: {layout: {width: 120, height: 32, x: 0, y: 0}}});
    expect(onLayoutContent).toHaveBeenCalledWith({nativeEvent: {width: 120, height: 32}});
  });

  it('answers bare outside a host', async () => {
    await render(<Hosted/>);
    expect(screen.getByText('bare')).toBeOnTheScreen();
  });
});
