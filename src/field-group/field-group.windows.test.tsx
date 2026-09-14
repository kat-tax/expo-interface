import {render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {colors} from '../theme';
import {ListItem} from '../list-item';
import {Switch} from '../switch';
import {FieldGroup} from '.';

describe('FieldGroup (windows)', () => {
  it('draws titled sections as cards of rows divided by hairlines, with a footer', async () => {
    await render(
      <FieldGroup testID="form">
        <FieldGroup.Section title="Sync" footer="Runs every hour." testID="sync">
          <Switch label="Notifications" value onValueChange={vi.fn()}/>
          {null}
          {false}
          <ListItem testID="row">Account</ListItem>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(screen.getByTestId('form')).toBeOnTheScreen();
    expect(screen.getByText('Sync')).toBeOnTheScreen();
    expect(screen.getByText('Runs every hour.')).toBeOnTheScreen();
    expect(screen.getByText('Notifications')).toBeOnTheScreen();
    // The section insets the row; the row gives up its own.
    expect(screen.getByTestId('row')).not.toHaveStyle({paddingHorizontal: 16});
    const second = screen.getByTestId('row').parent!;
    expect(second).toHaveStyle({borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.light.separator, minHeight: 48});
  });

  it('draws the title in upper case on request and the footer in the destructive color', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Danger" titleUppercase footer="This cannot be undone." footerColor="destructive">
          <Text>Delete</Text>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(screen.getByText('DANGER')).toBeOnTheScreen();
    expect(screen.getByText('This cannot be undone.')).toHaveStyle({color: colors.light.destructive});
  });

  it('has slot markers that render nothing on their own', async () => {
    await render(
      <>
        <FieldGroup.SectionHeader><Text>Header</Text></FieldGroup.SectionHeader>
        <FieldGroup.SectionFooter><Text>Footer</Text></FieldGroup.SectionFooter>
      </>,
    );
    expect(screen.toJSON()).toBeNull();
  });

  it('takes header and footer slots in place of the props', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Ignored" footer="Ignored too">
          <FieldGroup.SectionHeader><Text>Custom header</Text></FieldGroup.SectionHeader>
          <Text>Row</Text>
          <FieldGroup.SectionFooter><Text>Custom footer</Text></FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section>
          <Text>Untitled row</Text>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(screen.getByText('Custom header')).toBeOnTheScreen();
    expect(screen.getByText('Custom footer')).toBeOnTheScreen();
    expect(screen.queryByText('Ignored')).toBeNull();
    expect(screen.queryByText('Ignored too')).toBeNull();
    expect(screen.getByText('Untitled row')).toBeOnTheScreen();
  });
});
