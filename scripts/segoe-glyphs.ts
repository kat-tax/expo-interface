/**
 * Writes `src/symbol/segoe.generated.ts`: the table that draws a Material
 * Symbols name on Windows as a Segoe Fluent Icons glyph.
 *
 * Two catalogues go in. The Material names are the ones `expo-symbols` types
 * as `AndroidSymbol` (its `symbols.json`); the Segoe Fluent Icons catalogue
 * is `segoe-fluent-icons.json` next to this file, the WinUI 3 Gallery's list
 * of every glyph's name and code point (MIT). A Material name whose tokens
 * are a Segoe name's tokens is that glyph (`zoom_in` is `ZoomIn`), a
 * singular/plural pair counts when it is the only candidate (`movie` is
 * `Movies`), and `CURATED` names the twins the names alone do not find
 * (`arrow_back` is `Back`) or find wrongly (`pin` is the PIN pad, not the
 * pushpin). A glyph with a `Fill`, `Solid` or `Filled` form gets it as the
 * solid entry, which a `fill` token draws.
 *
 *     node scripts/segoe-glyphs.ts            write the table
 *     node scripts/segoe-glyphs.ts --check    exit 1 when the table is stale
 *     node scripts/segoe-glyphs.ts --report   Material names still without a twin, with the catalogue's tag hits
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOGUE = path.join(HERE, 'segoe-fluent-icons.json');
const OUTPUT = path.join(HERE, '..', 'src', 'symbol', 'segoe.generated.ts');

/** `[outline, solid?]` code points, the shape `SEGOE_GLYPHS` keeps. */
export type Glyph = [outline: string, fill?: string];

export interface SegoeIcon {
  code: string;
  name: string;
  tags: string[];
}

export type Via = 'curated' | 'name' | 'plural';

export interface Match {
  outline: string;
  fill?: string;
  via: Via;
}

/**
 * Material name to Segoe name, or `[outline, solid]` names where the solid
 * form is not the `Fill`/`Solid` suffix. Every name is checked against the
 * catalogue when the table is generated, so a typo fails here, not on a
 * screen. Ordered roughly as Material's own categories are.
 */
export const CURATED: Record<string, string | [string, string]> = {
  // Navigation
  apps: 'AllApps',
  arrow_back: 'Back',
  arrow_back_ios: 'ChevronLeft',
  arrow_back_ios_new: 'ChevronLeft',
  arrow_downward: 'Down',
  arrow_drop_down: 'CaretSolidDown',
  arrow_drop_up: 'CaretSolidUp',
  arrow_forward: 'Forward',
  arrow_forward_ios: 'ChevronRight',
  arrow_left: 'CaretSolidLeft',
  arrow_right: 'CaretSolidRight',
  arrow_upward: 'Up',
  close: 'Cancel',
  clear: 'Cancel',
  dashboard: 'ViewDashboard',
  drag_handle: 'GripperBarHorizontal',
  drag_indicator: 'GripperBarVertical',
  east: 'Forward',
  expand_less: 'ChevronUp',
  expand_more: 'ChevronDown',
  fullscreen: 'FullScreen',
  fullscreen_exit: 'BackToWindow',
  keyboard_arrow_down: 'ChevronDown',
  keyboard_arrow_left: 'ChevronLeft',
  keyboard_arrow_right: 'ChevronRight',
  keyboard_arrow_up: 'ChevronUp',
  launch: 'OpenInNewWindow',
  logout: 'SignOut',
  menu: 'GlobalNavButton',
  menu_open: 'OpenPane',
  more_horiz: 'More',
  more_vert: 'More',
  north: 'Up',
  open_in_new: 'OpenInNewWindow',
  south: 'Down',
  unfold_more: 'ScrollUpDown',
  west: 'Back',
  widgets: 'Widget',

  // Actions and states
  block: 'Blocked',
  bookmark: 'Bookmarks',
  build: 'Repair',
  bug_report: 'Bug',
  check: 'CheckMark',
  check_box: 'CheckboxComposite',
  check_box_outline_blank: 'Checkbox',
  check_circle: 'Completed',
  checklist: 'CheckList',
  create: 'Edit',
  dark_mode: 'QuietHours',
  delete_forever: 'Delete',
  done: 'CheckMark',
  error: ['Error', 'ErrorBadge'],
  favorite: 'Heart',
  favorite_border: 'Heart',
  filter_alt: 'Filter',
  filter_list: 'Filter',
  grade: 'FavoriteStar',
  handyman: 'Repair',
  indeterminate_check_box: 'CheckboxIndeterminate',
  key: 'Permissions',
  label: 'Tag',
  light_mode: 'Brightness',
  list: 'BulletedList',
  local_offer: 'Tag',
  lock_open: 'Unlock',
  not_interested: 'Blocked',
  pin: 'PINPad',
  push_pin: 'Pinned',
  question_mark: 'Unknown',
  radio_button_checked: 'RadioBtnOn',
  radio_button_unchecked: 'RadioBtnOff',
  schedule: 'Clock',
  security: 'Shield',
  sell: 'Tag',
  star: 'FavoriteStar',
  switch: 'ToggleRight',
  sync_problem: 'SyncError',
  task_alt: 'Completed',
  thumb_down: 'Dislike',
  thumb_up: 'Like',
  thumbs_up_down: 'LikeDislike',
  timer: 'Stopwatch',
  toggle_off: 'ToggleLeft',
  toggle_on: 'ToggleRight',
  touch_app: 'Touch',
  tune: 'Equalizer',
  view_list: 'List',
  visibility: 'RedEye',
  visibility_off: 'Hide',
  vpn_key: 'Permissions',
  wb_sunny: 'Brightness',

  // Editing and text
  attach_file: 'Attach',
  attachment: 'Attach',
  backspace: 'BackSpaceQWERTY',
  content_copy: 'Copy',
  content_cut: 'Cut',
  content_paste: 'Paste',
  copy_all: 'Copy',
  format_align_center: 'AlignCenter',
  format_align_left: 'AlignLeft',
  format_align_right: 'AlignRight',
  format_bold: 'Bold',
  format_color_text: 'FontColor',
  format_italic: 'Italic',
  format_list_bulleted: 'BulletedList',
  format_size: 'FontSize',
  format_strikethrough: 'Strikethrough',
  format_underlined: 'Underline',
  keyboard: 'KeyboardClassic',
  keyboard_return: 'ReturnKey',
  palette: 'Color',
  color_lens: 'Color',
  straighten: 'Ruler',
  text_fields: 'Font',

  // Files and documents
  article: 'Document',
  assignment: 'ClipboardList',
  audio_file: 'Audio',
  cloud_off: 'CloudNotSynced',
  cloud_upload: 'Upload',
  collections: 'PhotoCollection',
  create_new_folder: 'NewFolder',
  description: 'Document',
  draft: 'Page',
  drive_file_move: 'MoveToFolder',
  file_download: 'Download',
  file_upload: 'Upload',
  find_in_page: 'Search',
  folder_zip: 'ZipFolder',
  image: 'Photo2',
  insert_drive_file: 'Page',
  inventory: 'ClipboardList',
  inventory_2: 'Package',
  note_add: 'QuickNote',
  photo_library: 'Photo2',
  picture_as_pdf: 'PDF',
  video_file: 'Video',

  // Communication
  call: 'Phone',
  call_end: 'HangUp',
  chat: 'Message',
  chat_bubble: 'Message',
  drafts: 'Read',
  email: 'Mail',
  forum: 'ChatBubbles',
  forward_to_inbox: 'MailForward',
  mark_email_read: 'Read',
  message: 'Message',
  notifications: 'Ringer',
  notifications_active: 'Ringer',
  notifications_off: 'RingerSilent',
  reply_all: 'MailReplyAll',
  sms: 'Message',
  textsms: 'Message',

  // People
  account_circle: 'Contact',
  badge: 'IDBadge',
  contact_page: 'ContactInfo',
  people: 'People',
  groups: 'People',
  person: 'Contact',
  person_add: 'AddFriend',
  person_remove: 'UserRemove',
  support_agent: 'Headset',

  // Media
  album: 'MusicAlbum',
  camera_alt: 'Camera',
  fast_rewind: 'Rewind',
  mic: 'Microphone',
  movie: 'Movies',
  photo_camera: 'Camera',
  play_arrow: 'Play',
  repeat: 'RepeatAll',
  skip_next: 'Next',
  skip_previous: 'Previous',
  videocam: 'Video',
  volume_off: 'Mute',
  volume_up: 'Volume',

  // Places, time and things
  account_balance: 'Bank',
  accessibility: 'EaseOfAccess',
  accessibility_new: 'EaseOfAccess',
  admin_panel_settings: 'Admin',
  airplanemode_active: 'Airplane',
  bolt: 'LightningBolt',
  business_center: 'Work',
  calculate: 'Calculator',
  calendar_month: 'Calendar',
  calendar_today: 'Calendar',
  coffee: 'Cafe',
  credit_card: 'PaymentCard',
  date_range: 'CalendarWeek',
  directions_car: 'Car',
  eco: 'Leaf',
  emoji_emotions: 'Emoji',
  event: 'Calendar',
  extension: 'Puzzle',
  flash_on: 'LightningBolt',
  flight: 'Airplane',
  health_and_safety: 'Health',
  language: 'Globe',
  local_cafe: 'Cafe',
  location_on: 'MapPin',
  memory: 'CPU',
  mood: 'Emoji',
  my_location: 'Location',
  payments: 'PaymentCard',
  pie_chart: 'PieSingle',
  place: 'MapPin',
  power_settings_new: 'PowerButton',
  public: 'Globe',
  qr_code_2: 'QRCode',
  router: 'GatewayRouter',
  school: 'Education',
  science: 'Beaker',
  sd_card: 'SDCard',
  sensors: 'Sensor',
  shopping_bag: 'Shop',
  smartphone: 'CellPhone',
  speed: 'SpeedHigh',
  terminal: 'CommandPrompt',
  today: 'GotoToday',
  trending_down: 'StockDown',
  trending_up: 'StockUp',
  tv: 'TVMonitor',
  web: 'Website',
};

/**
 * Material names whose same-named Segoe glyph is a different thing and that
 * have no better twin: left without a glyph rather than drawn wrong.
 */
export const EXCLUDED: ReadonlySet<string> = new Set(['set', 'priority']);

/** `ZoomIn` to `zoom_in`, `QRCode` to `qr_code`, `Photo2` to `photo_2`. */
export function segoeKey(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1_$2')
    .toLowerCase();
}

/** The key with a plural last token made singular: `movies` to `movie`. */
function singular(key: string): string {
  return key.replace(/([a-z]{3,}[^s])s$/, '$1');
}

const SOLID_SUFFIXES = ['Fill', 'Solid', 'Filled'];

export function readCatalogue(): SegoeIcon[] {
  return (JSON.parse(readFileSync(CATALOGUE, 'utf8')) as {icons: SegoeIcon[]}).icons;
}

export function readMaterialNames(): string[] {
  const require = createRequire(import.meta.url);
  const symbols = path.join(path.dirname(require.resolve('expo-symbols')), 'android', 'symbols.json');
  return Object.keys(JSON.parse(readFileSync(symbols, 'utf8')) as Record<string, number>);
}

/** Matches every Material name to a Segoe glyph where one can be named. */
export function match(materialNames: string[], catalogue: SegoeIcon[]): Map<string, Match> {
  const byName = new Map(catalogue.map(icon => [icon.name, icon]));
  const byKey = new Map<string, SegoeIcon>();
  const byPlural = new Map<string, SegoeIcon[]>();
  for (const icon of catalogue) {
    const key = segoeKey(icon.name);
    if (!byKey.has(key)) byKey.set(key, icon);
    const folded = singular(key);
    byPlural.set(folded, [...(byPlural.get(folded) ?? []), icon]);
  }
  const solidOf = (name: string): string | undefined => {
    for (const suffix of SOLID_SUFFIXES) {
      const solid = byName.get(name + suffix);
      if (solid) return solid.code;
    }
    return undefined;
  };
  const named = (name: string): SegoeIcon => {
    const icon = byName.get(name);
    if (!icon) throw new Error(`No Segoe Fluent Icons glyph is named ${name}`);
    return icon;
  };

  const matches = new Map<string, Match>();
  for (const material of materialNames) {
    const curated = CURATED[material];
    if (curated) {
      const [outline, solid] = typeof curated === 'string' ? [curated] : curated;
      const icon = named(outline);
      matches.set(material, {outline: icon.code, fill: solid ? named(solid).code : solidOf(outline), via: 'curated'});
      continue;
    }
    if (EXCLUDED.has(material)) continue;
    const exact = byKey.get(material);
    if (exact) {
      matches.set(material, {outline: exact.code, fill: solidOf(exact.name), via: 'name'});
      continue;
    }
    const plural = byPlural.get(singular(material)) ?? [];
    if (plural.length === 1) {
      matches.set(material, {outline: plural[0].code, fill: solidOf(plural[0].name), via: 'plural'});
    }
  }
  for (const material of Object.keys(CURATED)) {
    if (!materialNames.includes(material)) throw new Error(`${material} is not a Material Symbols name`);
  }
  return matches;
}

export function toTable(matches: Map<string, Match>): Record<string, Glyph> {
  const table: Record<string, Glyph> = {};
  for (const [material, {outline, fill}] of [...matches].sort(([a], [b]) => (a < b ? -1 : 1))) {
    table[material] = fill ? [outline, fill] : [outline];
  }
  return table;
}

export function generate(): {table: Record<string, Glyph>; matches: Map<string, Match>; unmatched: string[]} {
  const materialNames = readMaterialNames();
  const matches = match(materialNames, readCatalogue());
  return {table: toTable(matches), matches, unmatched: materialNames.filter(name => !matches.has(name))};
}

function render(matches: Map<string, Match>, catalogue: SegoeIcon[]): string {
  const nameOf = new Map(catalogue.map(icon => [icon.code, icon.name]));
  const counts = {name: 0, plural: 0, curated: 0};
  for (const {via} of matches.values()) counts[via] += 1;
  const rows = [...matches]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([material, {outline, fill}]) => {
      const key = /^[a-z_][a-z0-9_]*$/.test(material) ? material : `'${material}'`;
      const codes = fill ? `'${outline}', '${fill}'` : `'${outline}'`;
      const names = fill ? `${nameOf.get(outline)}, ${nameOf.get(fill)}` : nameOf.get(outline);
      return `  ${key}: [${codes}], // ${names}`;
    });
  return [
    '// Generated by scripts/segoe-glyphs.ts from the Material Symbols names',
    "// expo-symbols types and the Segoe Fluent Icons catalogue — do not edit;",
    '// `bun run segoe:windows` regenerates it. Each line ends with the Segoe',
    '// name of the glyph, and of its solid form where the family has one.',
    `// ${matches.size} names: ${counts.name} matched by name, ${counts.plural} by singular and plural, ${counts.curated} curated.`,
    'export const SEGOE_GLYPHS: Record<string, [outline: string, fill?: string]> = {',
    ...rows,
    '};',
    '',
  ].join('\n');
}

function report(unmatched: string[], catalogue: SegoeIcon[]): void {
  const byTag = new Map<string, SegoeIcon[]>();
  for (const icon of catalogue) {
    for (const tag of icon.tags) byTag.set(tag, [...(byTag.get(tag) ?? []), icon]);
  }
  let hits = 0;
  for (const material of unmatched) {
    const candidates = byTag.get(material.replace(/_/g, ' ')) ?? [];
    if (candidates.length === 0) continue;
    hits += 1;
    console.log(`${material}: ${candidates.map(icon => `${icon.name}=${icon.code}`).join(' ')}`);
  }
  console.log(`${unmatched.length} Material names without a glyph, ${hits} with a tag hit above`);
}

function main(args: string[]): void {
  const catalogue = readCatalogue();
  const materialNames = readMaterialNames();
  const matches = match(materialNames, catalogue);
  const text = render(matches, catalogue);
  if (args.includes('--report')) {
    report(materialNames.filter(name => !matches.has(name)), catalogue);
    return;
  }
  if (args.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(OUTPUT, 'utf8');
    } catch {
      // Missing counts as stale.
    }
    if (current !== text) {
      console.error(`${path.relative(process.cwd(), OUTPUT)} is stale: run node scripts/segoe-glyphs.ts`);
      process.exit(1);
    }
    console.log(`${path.relative(process.cwd(), OUTPUT)} is current (${matches.size} names)`);
    return;
  }
  writeFileSync(OUTPUT, text);
  console.log(`wrote ${path.relative(process.cwd(), OUTPUT)}: ${matches.size} of ${materialNames.length} Material names`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
