import type {Meta, StoryObj} from '@storybook/react-native';
import {useState} from 'react';
import {SearchField} from '.';

const DROPS = ['HIS-201 Midterm Essay', 'Demo Reel', 'Project X Assets', 'Summer Mixtape'];

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  parameters: {
    docs: {
      description: {
        component:
          'A WinUI `AutoSuggestBox` on Windows and `<input type="search">` with a `<datalist>` on web, which makes the combobox keyboard pattern the browser\'s problem rather than the kit\'s. iOS and Android draw the box from the kit\'s own pieces — Compose\'s search bars take no `query` prop, so a controlled field cannot be built on them.',
      },
    },
  },
  args: {
    placeholder: 'Find a drop',
    // The field is controlled, so the story owns the text; `render` below
    // supplies the live pair.
    value: '',
    onChangeText: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return <SearchField {...args} value={value} onChangeText={setValue}/>;
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

/** With completions, the field is a combobox, and each platform draws its own list. */
export const WithSuggestions: Story = {args: {suggestions: DROPS}};

export const Disabled: Story = {args: {disabled: true}};
