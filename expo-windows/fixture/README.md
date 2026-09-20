# The fixture

The smallest Expo project there is: a manifest whose entry is Expo Router's, an
app config, and an icon. The runtime's Node tests read a real project where one
is needed: the public app config `withWindows` embeds for `expo-constants`, the
entry the transformer looks for, and the icon the tiles are rendered from. It is
not published and not an app that runs.
