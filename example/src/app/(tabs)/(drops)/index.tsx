import type {Href} from 'expo-router';
import type {HeaderSearchCommands} from 'expo-interface';
import {useRef, useState} from 'react';
import {router} from 'expo-router';
import {EmptyState, Fab, HeaderSearch, Screen} from 'expo-interface';
import {DropList} from '@/drop/list';
import {demoDropData} from '@/drop/data';
import * as icons from '@/icons';
import {useSearchPlacement} from '@/profile/search';

export default function HomeScreen() {
  const [first] = demoDropData;
  const [query, setQuery] = useState('');
  const search = useRef<HeaderSearchCommands>(null);
  // Where the search goes is picked live from the Settings screen, so every placement can be seen in the frame itself.
  const placement = useSearchPlacement();
  const needle = query.trim().toLowerCase();
  const drops = needle ? demoDropData.filter(drop => drop.name.toLowerCase().includes(needle)) : demoDropData;
  return (
    <Screen
      native
      // The screen floats the button over the list: bottom trailing, above the safe-area inset.
      fab={<Fab testID="new-drop" label="New drop" icon={icons.upload} onPress={() => router.push(`/${first.id}` as Href)}/>}>
      {/* The header's search, rendered in the screen's content and sent to the header from here; inside the
          screen, so a row the platform draws rather than its header is the screen's own. */}
      <HeaderSearch ref={search} testID="search-drops" placement={placement} placeholder="Search drops" onChangeText={setQuery}/>
      {drops.length === 0 ? (
        // A search that found nothing: the platform's own empty state, with the one thing to do about it
        // drawn as the kit's button inside it.
        <EmptyState
          testID="no-drops"
          title="No drops found"
          description={`Nothing is called "${query.trim()}". Try a shorter word.`}
          icon={icons.fileFind}
          action={{label: 'Clear search', variant: 'outlined', onPress: () => {
            search.current?.clear();
            setQuery('');
          }}}
        />
      ) : (
        <DropList
          items={drops}
          // SDK 56 typed-routes mis-generates dynamic routes, so cast the
          // runtime-correct path `/<nanoid>` to Href.
          onSelect={drop => router.push(`/${drop.id}` as Href)}
        />
      )}
    </Screen>
  );
}
