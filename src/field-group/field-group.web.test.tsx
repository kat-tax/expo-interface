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

  it('exposes the compound section components', () => {
    expect(FieldGroup.Section).toBeDefined();
    expect(FieldGroup.SectionHeader).toBeDefined();
    expect(FieldGroup.SectionFooter).toBeDefined();
  });
});
