import {SymbolView} from 'expo-symbols';
import {useColor} from 'expo-interface';
import * as icon from '@/icons';

export interface DropIconProps {
  size?: number;
}

export function DropIcon({size = 24}: DropIconProps) {
  const color = useColor('label');
  return (
    <SymbolView
      name={icon.drop.symbol}
      size={size}
      tintColor={color}
    />
  );
}
