import type {MenuItem} from '../menu/types';
import {Platform} from 'react-native';
import {filterItems} from './types';

const items: MenuItem[] = [
  {label: 'Heading'},
  {label: 'Task list', keywords: ['todo', 'checkbox']},
  {label: 'Bullet list'},
];

const labels = (filter?: string) => filterItems(items, filter).map(item => item.label);

describe(`PopupMenu filter (${Platform.OS})`, () => {
  it('keeps every entry for an empty or absent filter', () => {
    expect(labels()).toHaveLength(3);
    expect(labels('   ')).toHaveLength(3);
  });

  it('keeps the entries whose label contains the query, whatever the case', () => {
    expect(labels('  LIST ')).toEqual(['Task list', 'Bullet list']);
    expect(labels('head')).toEqual(['Heading']);
  });

  it('finds an entry by a keyword it is never labelled with', () => {
    // What the same thing is called elsewhere: `todo` is the task list.
    expect(labels('todo')).toEqual(['Task list']);
    expect(labels('CHECK')).toEqual(['Task list']);
  });

  it('keeps nothing the query finds neither way', () => {
    expect(labels('quote')).toEqual([]);
  });
});
