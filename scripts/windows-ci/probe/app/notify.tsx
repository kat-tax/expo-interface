/**
 * Notifications over the runtime's C++ module: the permission as the
 * system's setting, a toast scheduled a few seconds after the route opens,
 * what the notification center still shows, the badge, and the last click
 * — the route the Windows CI app and the harness carry to prove them on
 * screen.
 */
import {useEffect, useState} from 'react';
import {Body, Button, Screen, Title} from 'expo-interface';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false}),
});

export default function NotifyRoute() {
  const [permission, setPermission] = useState('…');
  const [scheduled, setScheduled] = useState('…');
  const [received, setReceived] = useState('none yet');
  const [presented, setPresented] = useState('…');
  const [badge, setBadge] = useState('…');
  const [response, setResponse] = useState('none yet');

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then(status => setPermission(`${status.status} · granted ${status.granted}`))
      .catch(error => setPermission(`✕ ${String(error)}`));
    Notifications.scheduleNotificationAsync({
      content: {title: 'Probe says hello', body: 'A toast from expo-notifications on Windows', data: {route: 'notify'}},
      trigger: {type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 4},
    })
      .then(async identifier => {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        setScheduled(`${identifier.slice(0, 8)}… in 4 s · ${all.length} waiting`);
      })
      .catch(error => setScheduled(`✕ ${String(error)}`));
    Notifications.setBadgeCountAsync(3)
      .then(async taken => setBadge(`set 3 · taken ${taken} · reads ${await Notifications.getBadgeCountAsync()}`))
      .catch(error => setBadge(`✕ ${String(error)}`));
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      setReceived(`"${notification.request.content.title}" at ${new Date(notification.date).toLocaleTimeString()}`);
      Notifications.getPresentedNotificationsAsync()
        .then(list => setPresented(`${list.length} in the notification center`))
        .catch(error => setPresented(`✕ ${String(error)}`));
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(({actionIdentifier, notification}) => {
      setResponse(`${actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ? 'opened' : actionIdentifier} "${notification.request.content.title}"`);
    });
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const notifyNow = () => {
    Notifications.scheduleNotificationAsync({content: {title: 'Right now', body: 'From the button'}, trigger: null}).catch(error => setScheduled(`✕ ${String(error)}`));
  };

  const dismiss = () => {
    Notifications.dismissAllNotificationsAsync()
      .then(() => setPresented('dismissed all'))
      .catch(error => setPresented(`✕ ${String(error)}`));
  };

  return (
    <Screen>
      <Title>Notify</Title>
      <Body testID="permission">{`Permission ${permission}`}</Body>
      <Body testID="scheduled">{`Scheduled ${scheduled}`}</Body>
      <Body testID="received">{`Received ${received}`}</Body>
      <Body testID="presented">{`Presented ${presented}`}</Body>
      <Body testID="badge">{`Badge ${badge}`}</Body>
      <Body testID="response">{`Response ${response}`}</Body>
      <Button label="Notify now" onPress={notifyNow} />
      <Button label="Dismiss all" onPress={dismiss} />
    </Screen>
  );
}
