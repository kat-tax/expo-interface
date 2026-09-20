import {render, screen} from '@testing-library/react';
import {Platform, Text} from 'react-native';

// A `.web.test.tsx` runs on web only, against the DOM react-native-web renders.
describe('a web test', () => {
  it('has the DOM and the jest-dom matchers', () => {
    expect(Platform.OS).toBe('web');
    render(<Text>In the document</Text>);
    expect(screen.getByText('In the document')).toBeInTheDocument();
  });
});
