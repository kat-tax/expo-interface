import {Platform} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {Typography} from '../typography';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {FieldGroup} from '.';

const isIOS = Platform.OS === 'ios';

/** Android section rows are `Box`es aligned `centerStart`; iOS rows live in the Section `content` slot. */
const rows = () => nodes().filter(n => n.props?.contentAlignment === 'centerStart');
const radii = (props: Record<string, any>) => modifier(props, 'clip')?.shape;

describe(`FieldGroup (${Platform.OS})`, () => {
  it('renders the native form container', async () => {
    await render(
      <FieldGroup testID="group">
        <FieldGroup.Section title="General">
          <Typography>Row</Typography>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    if (isIOS) {
      const [form] = nodes();
      expect(form.type).toBe('ViewManagerAdapter_ExpoUI_FormView');
      expect(form.props.modifiers).toEqual([]);
    } else {
      const {props} = byComposeTestID('group');
      expect(props.verticalArrangement).toEqual({spacedBy: 24});
      expect(props.contentPadding).toEqual({start: 16, end: 16, top: 16, bottom: 16});
      // No background: the app palette paints the screen behind the group.
      expect(modifier(props, 'background')).toBeUndefined();
    }
  });

  it('renders the section title and rows', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="General">
          <Typography>One</Typography>
          <Typography>Two</Typography>
          <Typography>Three</Typography>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    if (isIOS) {
      const section = host(p => p.title === 'General');
      const content = host(p => p.name === 'content', section);
      expect(content.children).toHaveLength(3);
    } else {
      const title = host(p => p.text === 'General');
      expect(title.props.color).toBe(colors.light.secondaryLabel);
      expect(title.props.typography).toBe('titleMedium');
      const boxes = rows();
      expect(boxes).toHaveLength(3);
      expect(radii(boxes[0].props)).toMatchObject({topStart: 20, topEnd: 20, bottomStart: 4, bottomEnd: 4});
      expect(radii(boxes[1].props)).toMatchObject({topStart: 4, topEnd: 4, bottomStart: 4, bottomEnd: 4});
      expect(radii(boxes[2].props)).toMatchObject({topStart: 4, topEnd: 4, bottomStart: 20, bottomEnd: 20});
      for (const box of boxes) {
        expect(modifier(box.props, 'background')).toEqual({$type: 'background', color: colors.light.backgroundElement});
        expect(modifier(box.props, 'defaultMinSize')).toEqual({$type: 'defaultMinSize', minHeight: 56});
        expect(modifier(box.props, 'padding')).toEqual({$type: 'padding', start: 16, top: 0, end: 16, bottom: 0});
      }
    }
  });

  (isIOS ? it.skip : it)('rounds every corner of a single-row section', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Only">
          <Typography>Row</Typography>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    expect(radii(rows()[0].props)).toMatchObject({topStart: 20, topEnd: 20, bottomStart: 20, bottomEnd: 20});
  });

  (isIOS ? it.skip : it)('uppercases the title on request', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Support" titleUppercase>
          <Typography>Row</Typography>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const title = host(p => p.text === 'SUPPORT');
    expect(title.props.letterSpacing).toBe(0.5);
  });

  it('renders custom header and footer slots', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Ignored">
          <FieldGroup.SectionHeader>
            <Typography testID="header">Storage</Typography>
          </FieldGroup.SectionHeader>
          <Typography>Drops</Typography>
          <FieldGroup.SectionFooter>
            <Typography testID="footer">Note</Typography>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    if (isIOS) {
      // A custom header replaces the plain title.
      expect(nodes().some(n => n.props?.title === 'Ignored')).toBe(false);
      const header = host(p => p.name === 'header');
      const footer = host(p => p.name === 'footer');
      const content = host(p => p.name === 'content');
      expect(host(p => p.testID === 'header', header)).toBeTruthy();
      expect(host(p => p.testID === 'footer', footer)).toBeTruthy();
      expect(content.children).toHaveLength(1);
    } else {
      expect(nodes().some(n => n.props?.text === 'Ignored')).toBe(false);
      const header = host(p => modifier(p, 'padding')?.bottom === 8);
      const footer = host(p => modifier(p, 'padding')?.top === 4);
      expect(host(p => p.testID === 'header', header)).toBeTruthy();
      expect(host(p => p.testID === 'footer', footer)).toBeTruthy();
      expect(rows()).toHaveLength(1);
    }
  });

  it('groups loose children into an implicit section', async () => {
    await render(
      <FieldGroup>
        <Typography>Alpha</Typography>
        <Typography>Beta</Typography>
        <FieldGroup.Section title="Explicit">
          <Typography>Gamma</Typography>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    if (isIOS) {
      // SwiftUI `Form` groups loose rows itself, so they stay direct children.
      const [form] = nodes();
      expect(form.children).toHaveLength(3);
      expect((form.children as {type: string}[]).map(c => c.type)).toEqual([
        'RCTText',
        'RCTText',
        'ViewManagerAdapter_ExpoUI_SectionView',
      ]);
      const contents = nodes().filter(n => n.props?.name === 'content');
      expect(contents).toHaveLength(1);
      expect(contents[0].children).toHaveLength(1);
    } else {
      const boxes = rows();
      expect(boxes).toHaveLength(3);
      expect(radii(boxes[0].props)).toMatchObject({topStart: 20, bottomStart: 4});
      expect(radii(boxes[1].props)).toMatchObject({topStart: 4, bottomStart: 20});
      expect(radii(boxes[2].props)).toMatchObject({topStart: 20, bottomStart: 20});
    }
  });

  it('hides the group and sections', async () => {
    await render(
      <FieldGroup hidden testID="group">
        <FieldGroup.Section title="General">
          <Typography>Row</Typography>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    if (isIOS) {
      const [form] = nodes();
      expect(modifier(form.props, 'hidden')).toMatchObject({$type: 'hidden'});
    } else {
      expect(screen.toJSON()).toBeNull();
    }
  });

  it('hides a single section', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Visible">
          <Typography>Row</Typography>
        </FieldGroup.Section>
        <FieldGroup.Section title="Secret" hidden>
          <Typography>Hidden row</Typography>
        </FieldGroup.Section>
      </FieldGroup>,
    );
    if (isIOS) {
      const section = host(p => p.title === 'Secret');
      expect(modifier(section.props, 'hidden')).toMatchObject({$type: 'hidden'});
    } else {
      expect(host(p => p.text === 'Visible')).toBeTruthy();
      expect(nodes().some(n => n.props?.text === 'Secret')).toBe(false);
      expect(rows()).toHaveLength(1);
    }
  });

  it('forwards a background color to the container', async () => {
    await render(
      <FieldGroup style={{backgroundColor: '#123456'}} testID="group">
        <Typography>Row</Typography>
      </FieldGroup>,
    );
    const {props} = isIOS ? nodes()[0] : byComposeTestID('group');
    expect(modifier(props, 'background')).toEqual({$type: 'background', color: '#123456'});
  });

  (isIOS ? it.skip : it)('renders a section with only a header and no rows', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Empty"/>
      </FieldGroup>,
    );
    expect(host(p => p.text === 'Empty')).toBeTruthy();
    expect(rows()).toHaveLength(0);
  });

  (isIOS ? it.skip : it)('flattens fragments inside a section, drops empty children and wraps raw text', async () => {
    await render(
      <FieldGroup>
        <FieldGroup.Section title="Mixed">
          <>
            <Typography>One</Typography>
            <Typography>Two</Typography>
          </>
          {false}
          {null}
          Plain text
          {42}
        </FieldGroup.Section>
      </FieldGroup>,
    );
    const boxes = rows();
    expect(boxes).toHaveLength(4);
    expect(host(p => p.text === 'Plain text').props.color).toBe(colors.light.label);
    expect(host(p => String(p.text) === '42')).toBeTruthy();
    expect(radii(boxes[0].props)).toMatchObject({topStart: 20, bottomStart: 4});
    expect(radii(boxes[3].props)).toMatchObject({topStart: 4, bottomStart: 20});
  });

  (isIOS ? it.skip : it)('unwraps fragments at the group level around explicit sections', async () => {
    await render(
      <FieldGroup>
        <></>
        <>
          <Typography>Alpha</Typography>
          <FieldGroup.Section title="Explicit">
            <Typography>Beta</Typography>
          </FieldGroup.Section>
          <Typography>Gamma</Typography>
        </>
      </FieldGroup>,
    );
    const boxes = rows();
    expect(boxes).toHaveLength(3);
    expect(host(p => p.text === 'Explicit')).toBeTruthy();
    // Alpha and Gamma each sit in their own implicit section around the explicit one.
    for (const box of boxes) {
      expect(radii(box.props)).toMatchObject({topStart: 20, bottomStart: 20});
    }
  });

  (isIOS ? it.skip : it)('renders the slot markers transparently on their own', async () => {
    await render(
      <>
        <FieldGroup.SectionHeader><Typography>Header</Typography></FieldGroup.SectionHeader>
        <FieldGroup.SectionFooter><Typography>Footer</Typography></FieldGroup.SectionFooter>
      </>,
    );
    expect(screen.getByText('Header')).toBeOnTheScreen();
    expect(screen.getByText('Footer')).toBeOnTheScreen();
  });
});
