import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {RouterApp, headerApp} from '../__stories__/router';
import {HeaderSearch} from '.';

const meta = {
  title: 'Navigation/HeaderSearch',
  component: HeaderSearch,
  parameters: {
    docs: {story: {inline: false, height: '380px'}, description: {component: 'The header’s search, in the placements the platforms have: a field under the title, the search in the bottom toolbar, a magnifier among the actions that expands into a field, or a field beside the title. Native on iOS and Android where the platform has the placement, drawn with `SearchField`’s box where it does not. The stories put it in a real header, which is what it reads its placement and its metrics from.'}},
    // The search sends itself to the header; the screens around it are plain.
    native: false,
  },
  args: {
    placeholder: 'Search photos',
    onChangeText: fn(),
    onSubmit: fn(),
    onOpen: fn(),
    onClose: fn(),
  },
  render: args => (
    <RouterApp routes={headerApp('Holiday photos', '12 files, shared until Friday.', () => <HeaderSearch {...args}/>)}/>
  ),
} satisfies Meta<typeof HeaderSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The platform’s choice: iOS decides, Android’s magnifier, a field beside the title on web and Windows. */
export const Automatic: Story = {};

/** The classic field under the title: iOS’s controller, a row under the header everywhere else. */
export const Stacked: Story = {
  args: {placement: 'stacked'},
};

/** A magnifier among the header’s controls that expands into the field: Android’s `SearchView`, iOS 26’s bar button, drawn on web and Windows. */
export const Action: Story = {
  args: {placement: 'action'},
};

/** A field in the bar beside the title, the desktop look: frameless on web, where the bar is its frame. */
export const Inline: Story = {
  args: {placement: 'inline'},
};

/** The search in a bottom toolbar: iOS 26’s glass, the kit’s `Toolbar` with the field elsewhere. */
export const Integrated: Story = {
  args: {placement: 'integrated'},
};

/**
 * A placeholder that says less where it has less room: in a web bar too
 * narrow for its labels the inline field shows the short one, and keeps the
 * full one as its name. Everywhere else it is the full one.
 */
export const ShortPlaceholder: Story = {
  args: {placement: 'inline', placeholder: state => (state.size === 'short' ? 'Search' : 'Search photos and files')},
};
