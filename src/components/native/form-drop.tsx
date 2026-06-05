import {useState} from 'react';
import {FieldGroup, Host, Switch, Text} from '@expo/ui';
import {DateTimePicker} from '@/components/ui/date-time';

interface FormDropProps {
  id: string;
}

export function FormDrop({id}: FormDropProps) {
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [datetime, setDatetime] = useState(() => new Date());

  return (
    <Host style={{flex: 1}}>
      <FieldGroup>
        <FieldGroup.Section title="Notifications">
          <Switch label="Push" value={notifications} onValueChange={setNotifications} />
          <Switch label="Email" value={analytics} onValueChange={setAnalytics} />
          <DateTimePicker label="Expiration" mode="datetime" value={datetime} onChange={setDatetime} />
        </FieldGroup.Section>
        <FieldGroup.Section title="About">
          <Text>Version 1.0.0</Text>
          <FieldGroup.SectionFooter>
            <Text textStyle={{fontSize: 12, color: '#8E8E93'}}>
              You are on the latest version.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
