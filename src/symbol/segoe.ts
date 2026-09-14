import type {IconToken} from '../icons';

/**
 * Segoe Fluent Icons code points for the Material Symbols names the kit and
 * its example use, so a token drawn on iOS, Android and web draws on Windows
 * too without naming a fourth glyph. A token can still name its own with
 * `windows` in the symbol map, which wins over this table.
 *
 * Where the family has a solid form of the glyph it is the second entry;
 * `fill` picks it, and falls back to the outline where there is none — the
 * same quiet fallback the web has without the variable font.
 */
export const SEGOE_GLYPHS: Record<string, [outline: string, fill?: string]> = {
  add: ['E710'],
  apps: ['E71D'],
  arrow_back: ['E72B'],
  arrow_downward: ['E74B'],
  arrow_forward: ['E72A'],
  arrow_upward: ['E74A'],
  attach_file: ['E723'],
  bluetooth: ['E702'],
  bookmark: ['E8A4', 'E8A4'],
  brightness: ['E706'],
  calendar_month: ['E787'],
  calendar_today: ['E787'],
  camera: ['E722'],
  chat: ['E8BD'],
  check: ['E73E'],
  check_circle: ['E930', 'E930'],
  chevron_left: ['E76B'],
  chevron_right: ['E76C'],
  close: ['E711'],
  cloud: ['E753'],
  cloud_download: ['EBD3'],
  cloud_upload: ['E898'],
  content_copy: ['E8C8'],
  content_cut: ['E8C6'],
  content_paste: ['E77F'],
  delete: ['E74D'],
  description: ['E8A5'],
  download: ['E896'],
  edit: ['E70F'],
  error: ['E783', 'EA39'],
  expand_less: ['E70E'],
  expand_more: ['E70D'],
  favorite: ['EB51', 'EB52'],
  filter_list: ['E71C'],
  flag: ['E7C1'],
  folder: ['E8B7'],
  format_bold: ['E8DD'],
  format_italic: ['E8DB'],
  format_underlined: ['E8DC'],
  fullscreen: ['E740'],
  help: ['E897'],
  history: ['E81C'],
  home: ['E80F'],
  image: ['EB9F'],
  info: ['E946'],
  inventory_2: ['E7B8'],
  keyboard: ['E765'],
  label: ['E8EC'],
  language: ['E774'],
  lightbulb: ['EA80'],
  link: ['E71B'],
  list: ['E8FD'],
  location_on: ['E707'],
  lock: ['E72E'],
  mail: ['E715'],
  menu: ['E700'],
  mic: ['E720'],
  more_horiz: ['E712'],
  more_vert: ['E712'],
  notifications: ['EA8F'],
  open_in_new: ['E8A7'],
  palette: ['E790'],
  pause: ['E769'],
  person: ['E77B'],
  phone: ['E717'],
  photo_camera: ['E722'],
  photo_library: ['EB9F'],
  play_arrow: ['E768'],
  print: ['E749'],
  push_pin: ['E840', 'E841'],
  qr_code: ['ED14'],
  redo: ['E7A6'],
  refresh: ['E72C'],
  remove: ['E738'],
  save: ['E74E'],
  schedule: ['E823'],
  search: ['E721'],
  send: ['E724'],
  settings: ['E713'],
  share: ['E72D'],
  shield: ['EA18'],
  sort: ['E8CB'],
  star: ['E734', 'E735'],
  stop: ['E71A'],
  sync: ['E895'],
  undo: ['E7A7'],
  upload: ['E898'],
  videocam: ['E714'],
  visibility: ['E7B3'],
  volume_up: ['E767'],
  warning: ['E7BA'],
  wifi: ['E701'],
  zoom_in: ['E8A3'],
  zoom_out: ['E71F'],
};

/**
 * The Segoe Fluent Icons code point (`E72D`) an icon token draws on Windows:
 * the token's own `windows` glyph, or the one this table keeps for its
 * Material name (`android`, then `web`). `undefined` where there is none — a
 * bare SF Symbol name, or a Material name the table has not met — and the
 * component draws nothing, as `SymbolView` does with no glyph.
 */
export function windowsGlyph(token: IconToken): string | undefined {
  const {symbol, fill} = token;
  if (typeof symbol !== 'object') return undefined;
  if ('windows' in symbol && symbol.windows) return symbol.windows;
  const entry = (symbol.android && SEGOE_GLYPHS[symbol.android]) ?? (symbol.web && SEGOE_GLYPHS[symbol.web]);
  if (!entry) return undefined;
  return fill ? entry[1] ?? entry[0] : entry[0];
}

/** The glyph as the character a `Text` draws: `E72D` → ``. */
export function glyphChar(codePoint: string): string {
  return String.fromCodePoint(parseInt(codePoint, 16));
}
