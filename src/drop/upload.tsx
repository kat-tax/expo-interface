import type {FileItemProps} from '@/file/item';

import {useState} from 'react';
import {SymbolView} from 'expo-symbols';
import {ScrollView, Column, Row, Spacer, Text} from '@expo/ui';
import {useColor, spacing} from '@/ui/theme';
import {fillWidth} from '@/ui/fill';
import {Button} from '@/ui/button';
import * as icon from '@/ui/icons';

import {getDrop} from './data';
import {UploadItem} from './upload-item';

export interface DropUploadProps {
  id: string;
}

export function DropUpload({id}: DropUploadProps) {
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const tint = useColor('tint');
  const border = useColor('separator');
  const background = useColor('background');
  const drop = getDrop(id);
  const [files, setFiles] = useState<FileItemProps[]>(drop?.files ?? []);

  const removeFile = (fileId: number) =>
    setFiles(prev => prev.filter(f => f.id !== fileId));

  const retryFile = (fileId: number) =>
    setFiles(prev => prev.map(f =>
      f.id === fileId ? {...f, status: 'complete', progress: 1} : f));

  return (
    <ScrollView>
      <Column spacing={spacing.four}>
        <Column spacing={spacing.two}>
          {drop?.description ? (
            <Text textStyle={{fontSize: 15, color: subtle, lineHeight: 21}}>
              {drop.description}
            </Text>
          ) : null}
          <Column spacing={spacing.one}>
            {drop?.expiresAt ? (
              <Row spacing={spacing.two} alignment="center">
                <SymbolView name={icon.calendar.symbol} size={16} tintColor={subtle}/>
                <Text textStyle={{fontSize: 14, color: subtle}}>
                  {formatExpiry(drop.expiresAt)}
                </Text>
              </Row>
            ) : null}
            {drop?.limit ? (
              <Row spacing={spacing.two} alignment="center">
                <SymbolView name={icon.limit.symbol} size={16} tintColor={subtle}/>
                <Text textStyle={{fontSize: 14, color: subtle}}>
                  {drop.limit}
                </Text>
              </Row>
            ) : null}
          </Column>
        </Column>

        <Column
          spacing={spacing.three}
          alignment="center"
          modifiers={fillWidth}
          style={{
            borderWidth: 1,
            borderColor: border,
            borderRadius: 20,
            // Android simulates rounded borders with layered backgrounds, so
            // without an explicit fill the whole box paints the border color.
            backgroundColor: background,
            paddingVertical: spacing.five,
            paddingHorizontal: spacing.three,
          }}>
          <SymbolView name={icon.upload.symbol} size={40} tintColor={subtle}/>
          <Column spacing={spacing.one} alignment="center">
            <Text textStyle={{fontSize: 18, fontWeight: '600', color: label}}>
              Add to the drop
            </Text>
            <Text textStyle={{fontSize: 14, color: subtle, textAlign: 'center'}}>
              Drag files here or choose a source
            </Text>
          </Column>
          <Row spacing={spacing.two} alignment="center" modifiers={fillWidth}>
            <Spacer flexible/>
            <Button
              variant="filled"
              size="small"
              label="Files"
              prefixIcon={icon.files}
              onPress={() => {}}
            />
            <Button
              variant="filled"
              size="small"
              label="Media"
              prefixIcon={icon.media}
              onPress={() => {}}
            />
            <Button
              variant="filled"
              size="small"
              label="Camera"
              prefixIcon={icon.camera}
              onPress={() => {}}
            />
            <Spacer flexible/>
          </Row>
        </Column>

        <Column spacing={spacing.two}>
          {files.length === 0 ? (
            <Text textStyle={{fontSize: 14, color: subtle, textAlign: 'center'}}>
              No files yet
            </Text>
          ) : (
            files.map(file => (
              <UploadItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
                onRetry={() => retryFile(file.id)}
              />
            ))
          )}
        </Column>

        <Spacer size={spacing.three}/>
        <Row alignment="center" modifiers={fillWidth}>
          <Spacer flexible/>
          <Text textStyle={{fontSize: 13, color: tint}}>
            {`${files.length} ${files.length === 1 ? 'file' : 'files'} · ${drop?.size ?? '0 B'}`}
          </Text>
          <Spacer flexible/>
        </Row>
      </Column>
    </ScrollView>
  );
}

function formatExpiry(d: Date): string {
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} • ${time}`;
}
