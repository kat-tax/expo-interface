import {Text, View} from 'react-native';
import * as compose from './expo-ui-jetpack-compose-modifiers';
import * as swift from './expo-ui-swift-ui-modifiers';
import {assign, elementsOf, elsewhere, forgetWarnings, iconOf, isDisabled, modifier, modifiersOf, observable, onTapOf, slotOf, styleOf, tagOf, textOf, valueOf, without} from './ui-kit';

function Slot(props: Record<string, unknown>) {
  return <>{props.children as React.ReactNode}</>;
}

describe('ui kit helpers (windows)', () => {
  it('reads the text a node holds, through elements, labels and titles', () => {
    expect(textOf('a')).toBe('a');
    expect(textOf(3)).toBe('3');
    expect(textOf(null)).toBe('');
    expect(textOf(true)).toBe('');
    expect(textOf(['a', <Text key="b">b</Text>, [<Text key="c">c</Text>]])).toBe('abc');
    expect(textOf(<Slot label="L">x</Slot>)).toBe('L');
    expect(textOf(<Slot title={7}>x</Slot>)).toBe('7');
    expect(textOf(<Slot text="t"/>)).toBe('t');
    expect(textOf(<Slot label={{}}>deep</Slot>)).toBe('deep');
    expect(textOf({} as never)).toBe('');
  });

  it('finds elements, slots and the rest among children', () => {
    const children = ['plain', <Slot key="s">slot</Slot>, <View key="v"/>];
    expect(elementsOf(children)).toHaveLength(2);
    expect(slotOf(children, Slot)).toBe('slot');
    expect(slotOf(children, Text)).toBeUndefined();
    expect(without(children, Slot)).toHaveLength(2);
  });

  it('renders nothing for another platform\'s component, warning once per name', () => {
    forgetWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Chart = elsewhere('Chart', "Swift Charts'");
    expect(Chart.displayName).toBe('Chart');
    expect(Chart({})).toBeNull();
    expect(Chart({})).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/Chart is Swift Charts'; it renders nothing on Windows/);
    elsewhere('Other')({});
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('reads modifiers: the last of a kind, the disabled and tap ones, a tag', () => {
    const modifiers = [swift.frame({width: 10}), swift.frame({width: 20}), 'junk', null, {}, swift.disabled(), swift.onTapGesture(() => 'tapped')];
    expect(modifiersOf(modifiers)).toHaveLength(4);
    expect(modifiersOf(undefined)).toEqual([]);
    expect(modifier(modifiers, 'frame')).toEqual({$type: 'frame', width: 20});
    expect(modifier(modifiers, 'nope')).toBeUndefined();
    expect(isDisabled(modifiers)).toBe(true);
    expect(isDisabled([swift.disabled(false)])).toBe(false);
    expect(isDisabled([])).toBe(false);
    expect(onTapOf(modifiers)?.()).toBe('tapped');
    expect(onTapOf([compose.clickable(() => 'clicked')])?.()).toBe('clicked');
    expect(onTapOf([{$type: 'onTapGesture'}])).toBeUndefined();
    expect(tagOf(<Slot modifiers={[swift.tag('a')]}/>)).toBe('a');
    expect(tagOf(<Slot modifiers={[{$type: 'tag', value: 2}]}/>)).toBe(2);
    expect(tagOf(<Slot modifiers={[{$type: 'tag', tag: {}}]}/>)).toBeUndefined();
    expect(tagOf(<Slot/>)).toBeUndefined();
  });

  it('turns the layout modifiers into a style, and ignores the rest', () => {
    expect(styleOf(undefined)).toBeUndefined();
    expect(styleOf([swift.bold()])).toBeUndefined();
    expect(styleOf([swift.frame({width: 10, height: 20, minWidth: 1, maxWidth: Infinity, minHeight: 2, maxHeight: 30})])).toEqual({width: 10, height: 20, minWidth: 1, maxWidth: '100%', minHeight: 2, maxHeight: 30});
    expect(styleOf([swift.frame({maxHeight: Infinity, width: 'x'})])).toEqual({maxHeight: '100%'});
    expect(styleOf([compose.size(3, 4), compose.width(5), compose.height(6)])).toEqual({width: 5, height: 6});
    expect(styleOf([compose.fillMaxWidth()])).toEqual({width: '100%'});
    expect(styleOf([compose.fillMaxHeight()])).toEqual({height: '100%'});
    expect(styleOf([compose.fillMaxSize()])).toEqual({width: '100%', height: '100%'});
    expect(styleOf([compose.matchParentSize()])).toEqual({position: 'absolute', top: 0, left: 0, right: 0, bottom: 0});
    expect(styleOf([swift.padding()])).toEqual({padding: 16});
    expect(styleOf([swift.padding({top: 1, leading: 2, bottom: 'default', trailing: 4})])).toEqual({paddingTop: 1, paddingLeft: 2, paddingBottom: 16, paddingRight: 4});
    expect(styleOf([swift.padding({horizontal: 3, all: 9})])).toEqual({paddingTop: 9, paddingBottom: 9, paddingLeft: 3, paddingRight: 3});
    expect(styleOf([compose.padding(1, 2, 3, 4)])).toEqual({paddingLeft: 1, paddingTop: 2, paddingRight: 3, paddingBottom: 4});
    expect(styleOf([compose.paddingAll(7)])).toEqual({padding: 7});
    expect(styleOf([swift.cornerRadius(8)])).toEqual({borderRadius: 8});
    expect(styleOf([compose.clip({cornerRadius: 6})])).toEqual({borderRadius: 6});
    expect(styleOf([compose.clip('circle')])).toBeUndefined();
    expect(styleOf([swift.opacity(0.5)])).toEqual({opacity: 0.5});
    expect(styleOf([compose.alpha(0.25)])).toEqual({opacity: 0.25});
    expect(styleOf([swift.hidden()])).toEqual({display: 'none'});
    expect(styleOf([swift.hidden(false)])).toBeUndefined();
    expect(styleOf([swift.offset({x: 1})])).toEqual({transform: [{translateX: 1}, {translateY: 0}]});
    expect(styleOf([compose.offset(1, 2)])).toEqual({transform: [{translateX: 1}, {translateY: 2}]});
    expect(styleOf([swift.zIndex(3)])).toEqual({zIndex: 3});
    expect(styleOf([swift.background('#fff')])).toEqual({backgroundColor: '#fff'});
    expect(styleOf([compose.background({} as never)])).toBeUndefined();
    expect(styleOf([swift.border({color: 'red', width: 2})])).toEqual({borderWidth: 2, borderColor: 'red'});
    expect(styleOf([compose.border(1, 'blue')])).toEqual({borderWidth: 1, borderColor: 'blue'});
    expect(styleOf([swift.border({color: 'red'})])).toEqual({borderWidth: 1, borderColor: 'red'});
    expect(styleOf([compose.weight(2)])).toEqual({flex: 2});
  });

  it('keeps observable state in JavaScript, and reads and sets text props of either kind', () => {
    const state = observable('a');
    const heard: string[] = [];
    state.onChange = value => heard.push(value);
    expect(state.value).toBe('a');
    expect(state.get()).toBe('a');
    state.set('b');
    state.value = 'c';
    expect(heard).toEqual(['b', 'c']);
    state.release();
    expect(valueOf('plain')).toBe('plain');
    expect(valueOf(state)).toBe('c');
    expect(valueOf(observable(null))).toBe('');
    expect(valueOf(undefined)).toBeUndefined();
    expect(valueOf(4)).toBeUndefined();
    assign(state, 'd');
    expect(state.value).toBe('d');
    assign('plain', 'e');
    assign({set: 3}, 'e');
    expect(iconOf('E710')).toEqual({symbol: {windows: 'E710'}});
    expect(iconOf(undefined)).toBeUndefined();
  });
});

describe('@expo/ui modifiers (windows)', () => {
  it('builds SwiftUI modifiers as the package would: named, defaulted, object and bare parameters', () => {
    expect(swift.tag('x')).toEqual({$type: 'tag', tag: 'x'});
    expect(swift.hidden()).toEqual({$type: 'hidden', hidden: true});
    expect(swift.disabled(false)).toEqual({$type: 'disabled', disabled: false});
    expect(swift.onLongPressGesture(() => {}, 2)).toMatchObject({$type: 'onLongPressGesture', minimumDuration: 2});
    expect(swift.shadow({radius: 3, x: 1})).toEqual({$type: 'shadow', radius: 3, x: 1});
    expect(swift.scrollTargetLayout()).toEqual({$type: 'scrollTargetLayout'});
    expect(swift.scrollTargetLayout('anything')).toEqual({$type: 'scrollTargetLayout', value: 'anything'});
    expect(swift.luminanceToAlpha()).toEqual({$type: 'luminanceToAlpha'});
    expect(swift.createModifier('custom', {a: 1})).toEqual({$type: 'custom', a: 1});
    expect(swift.createModifier('custom')).toEqual({$type: 'custom'});
    const listener = () => {};
    expect(swift.createModifierWithEventListener('onThing', listener, {b: 2})).toEqual({$type: 'onThing', b: 2, eventListener: listener});
    expect(swift.createModifierWithEventListener('onThing', listener)).toEqual({$type: 'onThing', eventListener: listener});
    expect(swift.createViewModifierEventListener([swift.onTapGesture(listener)])).toEqual({});
    expect(swift.isModifier(swift.bold())).toBe(true);
    expect(swift.isModifier({})).toBe(false);
    expect(swift.filterModifiers([swift.bold(), swift.italic(), null as never], ['bold'])).toEqual([{$type: 'bold'}]);
    expect(swift.filterModifiers(undefined, ['bold'])).toEqual([]);
    expect(swift.Animation.easeIn(0.3)).toEqual({type: 'easeIn', duration: 0.3});
    expect(swift.Animation.spring({bounce: 1})).toEqual({type: 'spring', bounce: 1});
    expect(swift.Animation.default()).toEqual({type: 'default'});
    expect(swift.shapes.roundedRectangle(4)).toEqual({type: 'roundedRectangle', cornerRadius: 4, style: undefined});
    expect(swift.shapes.capsule()).toEqual({type: 'capsule', style: undefined});
    expect(swift.shapes.unevenRoundedRectangle({topLeadingRadius: 2})).toEqual({type: 'unevenRoundedRectangle', topLeadingRadius: 2});
    expect(swift.shapes.concentricRectangle()).toEqual({type: 'concentricRectangle'});
    expect(swift.shapes.rectangle()).toEqual({type: 'rectangle'});
    expect(swift.shapes.circle()).toEqual({type: 'circle'});
    expect(swift.shapes.ellipse()).toEqual({type: 'ellipse'});
    for (const [name, make] of Object.entries(swift.Animation)) expect((make as () => {type: string})().type).toBe(name);
  });

  it('builds Compose modifiers as the package would, with the animation specs and shapes', () => {
    expect(compose.padding(1, 2, 3, 4)).toEqual({$type: 'padding', start: 1, top: 2, end: 3, bottom: 4});
    expect(compose.padding(1)).toEqual({$type: 'padding', start: 1});
    expect(compose.background('#000', {animationSpec: compose.spring(1, 2)})).toEqual({$type: 'background', color: '#000', options: {animationSpec: {type: 'spring', dampingRatio: 1, stiffness: 2}}});
    expect(compose.graphicsLayer({alpha: 0.5})).toEqual({$type: 'graphicsLayer', alpha: 0.5});
    expect(compose.imePadding()).toEqual({$type: 'imePadding'});
    expect(compose.selectableGroup('x')).toEqual({$type: 'selectableGroup', value: 'x'});
    expect(compose.createModifier('m')).toEqual({$type: 'm'});
    const listener = () => {};
    expect(compose.createModifierWithEventListener('onX', listener)).toEqual({$type: 'onX', eventListener: listener});
    expect(compose.createViewModifierEventListener([])).toEqual({});
    expect(compose.animated()).toEqual({type: 'animated', spec: undefined});
    expect(compose.tween(300, 0, 'linear')).toEqual({type: 'tween', durationMillis: 300, delayMillis: 0, easing: 'linear'});
    expect(compose.snap(5)).toEqual({type: 'snap', delayMillis: 5});
    expect(compose.keyframes({a: 1})).toEqual({type: 'keyframes', config: {a: 1}});
    expect(compose.Shapes.RoundedCorner(4)).toEqual({type: 'roundedCorner', cornerRadius: 4});
    expect(compose.Shapes.RoundedCornerPercent(50)).toEqual({type: 'roundedCornerPercent', percent: 50});
    expect(compose.Shapes.CutCorner(2)).toEqual({type: 'cutCorner', size: 2});
    expect(compose.Shapes.CutCornerPercent(10)).toEqual({type: 'cutCornerPercent', percent: 10});
    expect(compose.Shapes.Circle).toEqual({type: 'circle'});
    expect(compose.testID('t')).toEqual({$type: 'testID', testID: 't'});
  });
});
