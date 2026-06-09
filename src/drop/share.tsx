import {useState} from 'react';
import {Column, Row, Text, RNHostView} from '@expo/ui';
import {Button} from '@/ui/button';
import {useColor, spacing} from '@/ui/theme';
import {copyText, shareUrl} from '@/ui/link';
import {QRCode} from '@/ui/qr';
import {getDrop} from './data';
import {dropUrl, DROP_ORIGIN} from './host';

export interface DropShareProps {
  id?: string;
}

export function DropShare({id}: DropShareProps) {
  const label = useColor('label');
  const subtle = useColor('secondaryLabel');
  const [copied, setCopied] = useState(false);
  const drop = getDrop(id);
  const url = dropUrl(id ?? '');
  const display = `${DROP_ORIGIN}/${id ?? ''}`;
  return (
    <Column spacing={spacing.four} alignment="center">
      <Column spacing={spacing.one} alignment="center">
        <Text textStyle={{fontSize: 20, fontWeight: '600', color: label}}>
          {`Share ${drop?.name ?? 'Drop'}`}
        </Text>
        <Text textStyle={{fontSize: 13, color: subtle}}>
          Anyone with the link can view this drop
        </Text>
      </Column>
      <RNHostView matchContents>
        <QRCode value={url} size={200}/>
      </RNHostView>
      <Text textStyle={{fontSize: 14, color: subtle}} numberOfLines={1}>
        {display}
      </Text>
      <Row spacing={spacing.two}>
        <Button
          variant="outlined"
          label={copied ? 'Copied' : 'Copy link'}
          onPress={async () => setCopied(await copyText(url))}
        />
        <Button
          variant="filled"
          label="Share"
          onPress={() => shareUrl(url, drop?.name)}
        />
      </Row>
    </Column>
  );
}
