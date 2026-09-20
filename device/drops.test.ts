/**
 * The example app, driven as a person would drive it, on whichever platform the
 * runner was pointed at. The same file runs on Windows, web, iOS and Android:
 * nothing here names a coordinate or a platform.
 *
 *   HARNESS_PLATFORM=web HARNESS_URL=http://localhost:8085 bun run test:device
 *   HARNESS_PLATFORM=windows HARNESS_TARGET=…/Dropfiles.exe bun run test:device
 */
import {afterAll, describe, expect, it} from 'vitest';
import {by, device, element} from '../vitest/device/index.ts';

afterAll(async () => {
  await device.close();
});

describe(`the example on ${device.platform}`, () => {
  it('shows the drops it was given', async () => {
    await device.open('/');
    const tree = await device.fullSnapshot();
    expect(tree).toHaveElement(by.label('Drops'));
    expect(tree).toHaveElement(by.text('HIS-201 Midterm Essay'));
    // The picture, against a committed baseline. The tree above is what this
    // test is really about; the screenshot catches what a tree cannot see.
    await expect(device).toMatchScreenshot('drops');
  });

  it('moves to settings when the tab is pressed, and back', async () => {
    await element(by.label('Settings')).press();
    // Settings is the only screen with these fields, so their arrival is the
    // navigation having happened rather than a timer having elapsed.
    await element(by.label('Name')).waitFor();
    expect(await device.fullSnapshot()).toHaveElement(by.label('Email'));
    await expect(device).toMatchScreenshot('settings');

    await element(by.label('Drops')).press();
    await element(by.text('HIS-201')).waitFor();
  });

  it('finds a control by the testID it was given, not by its copy', async () => {
    // A label is the app's wording: it gets rewritten, and it gets translated.
    // A testID is what the source called the thing, so this assertion survives
    // both. It reaches the tree as `data-testid` on web and as
    // `AutomationProperties.AutomationId` on Windows.
    await element(by.label('Settings')).press();
    await element(by.testID('profile-name')).waitFor();
    const tree = await device.fullSnapshot();
    expect(tree).toHaveElement(by.testID('profile-email'));
    expect(tree).toHaveElement(by.testID('delete-account'));
    // The same node, found both ways: the id is an addition to the tree, not a
    // replacement for the name a screen reader reads.
    const byId = tree.nodes.find(node => node.testId === 'profile-name');
    expect(byId?.name).toBe('Name');
  });

  it('announces every control it offers', async () => {
    // What a screen reader would read. An interactive element with no name is
    // announced as its role alone — "button" — which is the defect this keeps
    // finding on Windows, where a glyph and a label in a panel name nothing.
    const tree = await device.snapshot({interactive: true});
    expect(tree.nodes.length).toBeGreaterThan(0);
    expect(tree).toBeFullyLabelled();
  });
});
