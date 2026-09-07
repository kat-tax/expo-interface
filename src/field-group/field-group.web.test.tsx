import {render, screen} from '@testing-library/react';
import {FieldGroup} from '.';

describe('FieldGroup (web)', () => {
  it('wraps the universal group in the CSS hook and clears its background', () => {
    render(
      <FieldGroup testID="group">
        <FieldGroup.Section title="General">
          <span>Row</span>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const group = screen.getByTestId('group');
    expect(group.closest('.field-group')).not.toBeNull();
    expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(group.style.backgroundColor);
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

  it('exposes the compound section components', () => {
    expect(FieldGroup.Section).toBeDefined();
    expect(FieldGroup.SectionHeader).toBeDefined();
    expect(FieldGroup.SectionFooter).toBeDefined();
  });
});
