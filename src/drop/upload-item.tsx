import type {FileItemProps} from '@/file/item';
import type {UploadStatus} from '@/file/types';
import {Column, Row, Spacer, Text} from '@expo/ui';
import {SymbolView} from 'expo-symbols';
import {FileIcon} from '@/file/icon';
import {Button} from '@/ui/button';
import {Progress} from '@/ui/progress';
import {fillWidth} from '@/ui/fill';
import {useColor, spacing} from '@/ui/theme';
import * as icon from '@/ui/icons';

export interface UploadItemProps {
  file: FileItemProps;
  onRemove?: () => void;
  onRetry?: () => void;
}

export function UploadItem({file, onRemove, onRetry}: UploadItemProps) {
  const card = useColor('backgroundElement');
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const colorMap = {
    uploading: useColor('tint'),
    complete: useColor('switchOn'),
    failed: useColor('destructive'),
  } as const;
  const status = file.status ?? 'complete';
  const progress = file.progress ?? 1;
  const failed = status === 'failed';
  const accent = colorMap[status];

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
              name={failed ? icon.failed.symbol : icon.complete.symbol}
              size={14}
              tintColor={accent}
            />
            <Text textStyle={{fontSize: 13, fontWeight: '500', color: accent}}>
              {STATUS_LABEL[status](progress)}
            </Text>
          </Row>
        </Column>
        <Spacer flexible/>
        {failed ? (
          <Button
            variant="text"
            role="destructive"
            label="Try again"
            prefixIcon={icon.retry}
            onPress={() => onRetry?.()}
          />
        ) : null}
        <Button
          variant="text"
          size="small"
          shape="circle"
          hideLabel
          label="Remove"
          prefixIcon={icon.trash}
          color={subtle}
          onPress={() => onRemove?.()}
        />
      </Row>
      {!failed ? <Progress value={progress} color={accent}/> : null}
    </Column>
  );
}

const STATUS_LABEL: Record<UploadStatus, (p: number) => string> = {
  complete: () => 'Complete',
  failed: () => 'Failed',
  uploading: (p: number) => `Uploading · ${Math.round(p * 100)}%`,
};
