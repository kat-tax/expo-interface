import type {ImageSourcePropType} from 'react-native';

import add from '@expo/material-symbols/add.xml';
import chevron_right from '@expo/material-symbols/chevron_right.xml';
import delete_icon from '@expo/material-symbols/delete.xml';
import info from '@expo/material-symbols/info.xml';
import settings from '@expo/material-symbols/settings.xml';
import share from '@expo/material-symbols/share.xml';
import star from '@expo/material-symbols/star.xml';
// `@expo/material-symbols` only ships the outlined set; the filled star is
// the one `npx add-material-symbols --fill star` writes.
import star_fill from './assets/star_fill.xml';

export const drawables: Record<string, ImageSourcePropType | undefined> = {
  add,
  chevron_right,
  delete: delete_icon,
  info,
  settings,
  share,
  star,
  star_fill,
};
