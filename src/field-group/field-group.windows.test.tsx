import {render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {colors} from '../theme';
import {ListItem} from '../list-item';
import {Switch} from '../switch';
import {ScrollInsetsContext} from '../screen/insets';
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

  it('pads the form by the bar it passes under', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 30, bottom: 10, left: 0, right: 0, automatic: false}}>
        <FieldGroup testID="group">
          <FieldGroup.Section title="General">
            <Text>Row</Text>
          </FieldGroup.Section>
        </FieldGroup>
      </ScrollInsetsContext.Provider>,
    );
    expect(StyleSheet.flatten(screen.getByTestId('group').props.contentContainerStyle)).toMatchObject({paddingTop: 16 + 30, paddingBottom: 16 + 10});
  });

  it('draws nothing while hidden, and leaves out a hidden section', async () => {
    await render(
      <FieldGroup hidden testID="group">
        <FieldGroup.Section title="General">
          <Text>Row</Text>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(screen.toJSON()).toBeNull();
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Visible">
          <Text>Shown row</Text>
        </FieldGroup.Section>
        <FieldGroup.Section title="Secret" hidden testID="secret">
          <Text>Hidden row</Text>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(screen.getByText('Shown row')).toBeOnTheScreen();
    expect(screen.queryByText('Secret')).toBeNull();
    expect(screen.queryByText('Hidden row')).toBeNull();
    expect(screen.queryByTestId('secret')).toBeNull();
  });

  it('groups loose rows into a card of their own, around the sections, as the other platforms do', async () => {
    /** A section in a component of the app's own, which the group finds through the section itself. */
    function Account() {
      return (
        <FieldGroup.Section title="Account" testID="account">
          <Text testID="email">Email</Text>
        </FieldGroup.Section>
      );
    }
    await render(
      <FieldGroup>
        <Text testID="alpha">Alpha</Text>
        <>
          <Text testID="beta">Beta</Text>
        </>
        <FieldGroup.Section title="Explicit">
          <Text>Gamma</Text>
        </FieldGroup.Section>
        <Text testID="delta">Delta</Text>
        <Account/>
      </FieldGroup>,
    );
    const row = (id: string) => screen.getByTestId(id).parent!;
    // Alpha and Beta are the first and second rows of one card, divided by a hairline.
    expect(row('alpha')).toHaveStyle({minHeight: 48});
    expect(row('alpha')).not.toHaveStyle({borderTopWidth: StyleSheet.hairlineWidth});
    expect(row('beta')).toHaveStyle({minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth});
    // Delta, after the explicit section, starts a card of its own.
    expect(row('delta')).toHaveStyle({minHeight: 48});
    expect(row('delta')).not.toHaveStyle({borderTopWidth: StyleSheet.hairlineWidth});
    // The app's own section is a section, not a row of Delta's card.
    expect(screen.getByText('Account')).toBeOnTheScreen();
    expect(row('email')).not.toHaveStyle({borderTopWidth: StyleSheet.hairlineWidth});
    expect(screen.getByTestId('account').parent).not.toHaveStyle({minHeight: 48});
  });
});
