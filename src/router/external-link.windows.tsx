import type {ComponentProps} from 'react';
import {Linking} from 'react-native';
import {Href, Link} from 'expo-router';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: Href & string
};

/**
 * Windows: the href opens in the default browser through React Native's
 * `Linking`, which react-native-windows implements over the shell. A desktop
 * has no in-app browser to present, and `expo-web-browser`, which the other
 * platforms open one with, has no Windows module and throws at import — so
 * this file never reaches for it, and importing the kit stays safe. Expo
 * Router's own press is prevented so the link opens once.
 */
export function ExternalLink({href, ...rest}: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={event => {
        event.preventDefault();
        void Linking.openURL(href);
      }}
    />
  );
}
