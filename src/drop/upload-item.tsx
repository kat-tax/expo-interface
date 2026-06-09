import type {FileItemProps} from '@/file/item';
import type {UploadStatus} from '@/file/types';
import {SymbolView} from 'expo-symbols';
import {Column, Row, Spacer, Text} from '@expo/ui';
import {FileIcon} from '@/file/icon';
import {Button} from '@/ui/button';
import {Progress} from '@/ui/progress';
import {fillWidth} from '@/ui/fill';
import {ICON_TRASH, ICON_RETRY, ICON_COMPLETE, ICON_FAILED} from '@/ui/icons';
import {useColor, spacing} from '@/ui/theme';

const STATUS_COLOR = {
  complete: '#34C759',
  uploading: '#0A84FF',
  failed: '#FF3B30',
} as const;

export interface UploadItemProps {
  file: FileItemProps;
  onRemove?: () => void;
  onRetry?: () => void;
}

export function UploadItem({file, onRemove, onRetry}: UploadItemProps) {
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const card = useColor('backgroundElement');
  const status = file.status ?? 'complete';
  const progress = file.progress ?? 1;
  const failed = status === 'failed';
  const accent = STATUS_COLOR[status];

  return (
    <Column
      spacing={spacing.two}
      modifiers={fillWidth}
      style={{backgroundColor: card, borderRadius: 16, padding: spacing.three}}>
      <Row spacing={spacing.three} alignment="center" modifiers={fillWidth}>
        <FileIcon name={file.type} size={36}/>
        <Column spacing={spacing.half}>
          <Text textStyle={{fontSize: 16, fontWeight: '600', color: label}} numberOfLines={1}>
            {file.name}
          </Text>
          <Row spacing={spacing.one} alignment="center">
            <Text textStyle={{fontSize: 13, color: subtle}}>{file.size}</Text>
            <SymbolView
              name={failed ? ICON_FAILED.symbol : ICON_COMPLETE.symbol}
              size={14}
              tintColor={accent}
            />
            <Text textStyle={{fontSize: 13, fontWeight: '500', color: accent}}>
              {STATUS_LABEL[status](progress)}
            </Text>
          </Row>
        </Column>
        <Spacer flexible/>
        <Button
          variant="text"
          size="small"
          shape="circle"
          hideLabel
          label="Remove"
          prefixIcon={ICON_TRASH}
          color={subtle}
          onPress={() => onRemove?.()}
        />
      </Row>
      {failed ? (
        <Button
          variant="text"
          role="destructive"
          label="Try again"
          prefixIcon={ICON_RETRY}
          onPress={() => onRetry?.()}
        />
      ) : (
        <Progress value={progress} color={accent}/>
      )}
    </Column>
  );
}

const STATUS_LABEL: Record<UploadStatus, (p: number) => string> = {
  complete: () => 'Complete',
  failed: () => 'Failed',
  uploading: (p: number) => `Uploading · ${Math.round(p * 100)}%`,
};
