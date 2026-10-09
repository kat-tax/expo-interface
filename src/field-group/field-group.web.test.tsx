import {render, screen} from '@testing-library/react';
import {ListItem} from '../list-item';
import {ScrollInsetsContext} from '../screen/insets';
import {FieldGroup} from '.';

/** The group's own scroll view, two levels above a section drawn as one of its children. */
const sectionOfGroup = (element: HTMLElement) => element.parentElement!.parentElement;

describe('FieldGroup (web)', () => {
  it('draws the group in the CSS hook, with no background of its own', () => {
    render(
      <FieldGroup testID="group">
        <FieldGroup.Section title="General">
          <span>Row</span>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const group = screen.getByTestId('group');
    expect(group.closest('.field-group')).not.toBeNull();
    expect(['', 'transparent', 'rgba(0, 0, 0, 0)']).toContain(group.style.backgroundColor);
  });

  it('takes a section an app component renders as a section, beside the implicit ones', () => {
    function Appearance() {
      return (
        <FieldGroup.Section title="Appearance" testID="appearance">
          <span>Dark</span>
        </FieldGroup.Section>
      );
    }
    render(
      <FieldGroup testID="group">
        <span>Loose</span>
        <Appearance/>
        <>
          <span>Also loose</span>
        </>
      </FieldGroup>,
    );
    expect(sectionOfGroup(screen.getByTestId('appearance'))).toBe(screen.getByTestId('group'));
    expect(screen.getByTestId('appearance').contains(screen.getByText('Loose'))).toBe(false);
    expect(screen.getByTestId('appearance').contains(screen.getByText('Also loose'))).toBe(false);
  });

  it('takes a child back as a row once it renders no section, and counts each section it renders', () => {
    function Maybe({sections}: {sections: number}) {
      if (sections === 0) return <span>Row</span>;
      return (
        <>
          <FieldGroup.Section title="First" testID="first"><span>One</span></FieldGroup.Section>
          {sections > 1 ? <FieldGroup.Section title="Second" testID="second"><span>Two</span></FieldGroup.Section> : null}
        </>
      );
    }
    const {rerender} = render(<FieldGroup testID="group"><Maybe sections={2}/></FieldGroup>);
    expect(sectionOfGroup(screen.getByTestId('second'))).toBe(screen.getByTestId('group'));
    // One of the two goes: the child is still a section.
    rerender(<FieldGroup testID="group"><Maybe sections={1}/></FieldGroup>);
    expect(sectionOfGroup(screen.getByTestId('first'))).toBe(screen.getByTestId('group'));
    // None left: the child is a row again, in an implicit section's card.
    rerender(<FieldGroup testID="group"><Maybe sections={0}/></FieldGroup>);
    const row = screen.getByText('Row');
    expect(row.parentElement!.parentElement!.parentElement!.parentElement!.parentElement).toBe(screen.getByTestId('group'));
  });

  it('pads the content by the bar it passes under, and keeps the universal group\'s lifecycle and hidden', () => {
    const onAppear = vi.fn();
    const onDisappear = vi.fn();
    const {unmount} = render(
      <ScrollInsetsContext.Provider value={{top: 80, bottom: 20, left: 0, right: 0, automatic: false}}>
        <FieldGroup testID="group" onAppear={onAppear} onDisappear={onDisappear}>
          <span>Row</span>
        </FieldGroup>
      </ScrollInsetsContext.Provider>,
    );
    const content = screen.getByTestId('group').firstElementChild as HTMLElement;
    expect(getComputedStyle(content).paddingTop).toBe('96px');
    expect(getComputedStyle(content).paddingBottom).toBe('36px');
    expect(onAppear).toHaveBeenCalledTimes(1);
    unmount();
    expect(onDisappear).toHaveBeenCalledTimes(1);
    render(<FieldGroup testID="hidden" hidden><span>Row</span></FieldGroup>);
    expect(getComputedStyle(screen.getByTestId('hidden')).display).toBe('none');
  });

  it('keeps user styles while forcing the transparent background', () => {
    render(<FieldGroup testID="group" style={{height: 300, backgroundColor: 'red'}}/>);
    const group = screen.getByTestId('group');
    expect(group.style.height).toBe('300px');
    expect(group.style.backgroundColor).not.toBe('red');
  });

  it('renders section titles and separates rows', () => {
    render(
      <FieldGroup>
        <FieldGroup.Section title="General" testID="section">
          <span>One</span>
          <span>Two</span>
          <span>Three</span>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const section = screen.getByTestId('section');
    expect(section).toHaveTextContent('General');
    expect(section.querySelectorAll('[role="separator"]')).toHaveLength(2);
    expect(section).toHaveTextContent('OneTwoThree');
  });

  it('uppercases the title on request', () => {
    render(
      <FieldGroup>
        <FieldGroup.Section title="Support" titleUppercase testID="section">
          <span>Row</span>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    // The transform is CSS; the DOM keeps the original casing.
    expect(screen.getByTestId('section')).toHaveTextContent('Support');
  });

  it('renders custom header and footer slots', () => {
    render(
      <FieldGroup>
        <FieldGroup.Section testID="section">
          <FieldGroup.SectionHeader>
            <h2>Storage</h2>
          </FieldGroup.SectionHeader>
          <span>Drops</span>
          <FieldGroup.SectionFooter>
            <small>Footer note</small>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const section = screen.getByTestId('section');
    expect(screen.getByRole('heading', {name: 'Storage'})).toBeInTheDocument();
    expect(section.querySelector('small')).toHaveTextContent('Footer note');
    // Header/footer are not rows, so there is no separator for them.
    expect(section.querySelectorAll('[role="separator"]')).toHaveLength(0);
  });

  it('groups loose children into an implicit section', () => {
    render(
      <FieldGroup testID="group">
        <span>Alpha</span>
        <span>Beta</span>
      </FieldGroup>,
    );
    const group = screen.getByTestId('group');
    expect(group.querySelectorAll('[role="separator"]')).toHaveLength(1);
    expect(group).toHaveTextContent('AlphaBeta');
  });

  it('renders the footer prop as a footnote under the rows', () => {
    render(
      <FieldGroup>
        <FieldGroup.Section title="Connection" footer="Optional. When signed in, documents are backed up." testID="section">
          <span>Row</span>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const section = screen.getByTestId('section');
    const note = screen.getByText('Optional. When signed in, documents are backed up.');
    expect(section.contains(note)).toBe(true);
    expect(note.style.color).toBe('var(--color-secondary-label)');
    expect(section.querySelectorAll('[role="separator"]')).toHaveLength(0);
    expect(section.lastElementChild?.contains(note)).toBe(true);
  });

  it('colors the footer for an error and lets a SectionFooter slot win', () => {
    render(
      <FieldGroup>
        <FieldGroup.Section footer="The server could not be reached." footerColor="destructive">
          <span>One</span>
        </FieldGroup.Section>
        <FieldGroup.Section footer="Ignored">
          <span>Two</span>
          <FieldGroup.SectionFooter>
            <small>Custom</small>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(screen.getByText('The server could not be reached.').style.color).toBe('var(--color-destructive)');
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.queryByText('Ignored')).toBeNull();
  });

  it('keeps kit sections as sections, also inside fragments', () => {
    render(
      <FieldGroup testID="group">
        <>
          <FieldGroup.Section title="One" footer="First note" testID="one">
            <span>Row</span>
          </FieldGroup.Section>
          <span>Loose</span>
        </>
        {null}
      </FieldGroup>,
    );
    const group = screen.getByTestId('group');
    const one = screen.getByTestId('one');
    // The kit section is not nested in an implicit one: its parent is the group's content.
    expect(one.parentElement?.parentElement).toBe(group);
    expect(one).toHaveTextContent('First note');
    expect(group).toHaveTextContent('Loose');
  });

  it('renders a standalone section with its footer', () => {
    render(
      <FieldGroup.Section title="Alone" footer="Note" testID="section">
        <span>Row</span>
      </FieldGroup.Section>,
    );
    expect(screen.getByTestId('section')).toHaveTextContent('Note');
  });

  it('takes the inset off the ListItem rows it is given, unless one asks for it', () => {
    render(
      <FieldGroup>
        <FieldGroup.Section title="Connection">
          <ListItem testID="flushed">Account</ListItem>
          <ListItem inset testID="kept">Account</ListItem>
          <span data-testid="other">Row</span>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(screen.getByTestId('flushed')).toHaveClass('ui-list-item--flush');
    expect(screen.getByTestId('kept')).not.toHaveClass('ui-list-item--flush');
    expect(screen.getByTestId('other')).toHaveTextContent('Row');
  });

  it('exposes the compound section components', () => {
    expect(FieldGroup.Section).toBeDefined();
    expect(FieldGroup.SectionHeader).toBeDefined();
    expect(FieldGroup.SectionFooter).toBeDefined();
  });
});
