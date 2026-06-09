import {SymbolView} from 'expo-symbols';
import {useColor} from '@/ui/theme';
import * as _ from '@/ui/icons';

export interface DropIconProps {
  size?: number;
}

export function DropIcon({size = 24}: DropIconProps) {
  const color = useColor('label');
  return (
    <SymbolView
      name={_.ICON_DROP.symbol}
      size={size}
      tintColor={color}
    />
  );
}
