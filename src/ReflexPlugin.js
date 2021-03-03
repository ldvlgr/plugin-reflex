import React from 'react';
import { VERSION, View, Actions, Notifications, NotificationType } from '@twilio/flex-ui';

import { FlexPlugin } from 'flex-plugin';

import CustomTaskListContainer from './components/CustomTaskList/CustomTaskList.Container';
import reducers, { namespace } from './states';

import VoicemailNavButton from './components/VoicemailNavButtonComponent';
import VoicemailView from './components/VoicemailViewComponent';

const PLUGIN_NAME = 'ReflexPlugin';

export default class ReflexPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    this.registerReducers(manager);

    // From SAMPLE
    // const options = { sortOrder: -1 };
    // flex.AgentDesktopView
    //   .Panel1
    //   .Content
    //   .add(<CustomTaskListContainer key="ReflexPlugin-component" />, options);

    const TRANSFER_BLOCKED = 'TransferBlocked';
    manager.strings[TRANSFER_BLOCKED] = (
      'This is a not-staffed test queue. Transfer to this queue has been blocked.'
    );

    Notifications.registerNotification({
      id: TRANSFER_BLOCKED,
      closeButton: true,
      content: TRANSFER_BLOCKED,
      type: NotificationType.warning,
      timeout: 5000
    });




    //Global var to store queues object
    let queues = undefined;

    const getQueues2 = () => new Promise(async (resolve) => {
      if (!queues) {
        const query = await manager.insightsClient.instantQuery('tr-queue');
        query.on('searchResult', (items) => {
          console.log('Storing queues once');
          queues = items;
          resolve(items);
        });
        query.search('');
      } else {
        resolve(queues);
      }
    });

    //BLOCK TRANSFER TO SOME QUEUES
    Actions.addListener('beforeTransferTask', async (payload, abortFunction) => {
      console.log('beforeTransferTaskPayload: ', payload);
      const targetSid = payload.targetSid;
      if (targetSid.startsWith('WQ')) {
        const queues = await getQueues2();
        console.debug('queues retrieved:', queues);
        //queues is map/object with queue objects {queue_name: , queue_sid: }
        let targetQueue = Object.values(queues).find(queue => queue.queue_sid === targetSid);
        console.log('targetQueueName: ', targetQueue);
        //Either queue is new (no recent tasks) or name matches a not staffed queue
        if (!targetQueue || targetQueue.queue_name.toLowerCase().includes('not')) {
          Notifications.showNotification(TRANSFER_BLOCKED);
          abortFunction();
        }
      }
    });


    //PLAY AUDIO ON INBOUND CALLS
    // const audio = new Audio('https://api.twilio.com/cowbell.mp3');
    // const playAudio = reservation => {
    //   audio.play();
    //   ['accepted', 'canceled', 'rejected', 'rescinded', 'timeout'].forEach(e => {
    //     reservation.on(e, () => audio.pause());
    //   });
    // };

    // manager.workerClient.on('reservationCreated', reservation => {
    //   console.log('reservationCreated: ', reservation);
    //   const isVoiceQueue = reservation.task.taskChannelUniqueName === 'voice';
    //   const isInboundTask = reservation.task.attributes.direction === 'inbound';
    //   if (isVoiceQueue && isInboundTask) {
    //     console.log('Task is incoming call');
    //     playAudio(reservation);
    //   }
    // });



    //SET OUTBOUND CALLER ID
    Actions.addListener('beforeStartOutboundCall', async (payload) => {
      console.log('BEFORE StartOutboundCall payload:', payload);
      let outboundQueueSid = payload.queueSid;
      const queues = await getQueues2();
      console.debug('queues retrieved:', queues);
      //queues is map/object with queue objects {queue_name: , queue_sid: }
      let outboundQueue = Object.values(queues).find(queue => queue.queue_sid === outboundQueueSid);
      let outboundQueueName = outboundQueue?.queue_name || "Unknown";
      console.log('outboundQueueName: ', outboundQueueName);
      //add queue name to payload
      payload.outboundQueueName = outboundQueueName;
      //default callerId
      let newCallerId = '+18044558186';
      if (outboundQueueName.includes('TN')) { newCallerId = '+16156479890'; }
      payload.callerId = newCallerId;
    });




    //UTILS?


    const addCallDataToTask = async (task, callSid, conferenceSid) => {
      const { attributes } = task;
      const { conversations } = attributes;
      const newAttributes = { ...attributes };

      let newConv = {};
      if (conversations) {
        newConv = { ...conversations };
      }
      //add outcome
      newConv.outcome = 'Completed';
      newAttributes.conversations = newConv;

      newAttributes.call_sid = callSid;
      if (conferenceSid) {
        newAttributes.conference = { sid: conferenceSid };
      }
      await task.setAttributes(newAttributes);
    }

    //VoiceMail side nav button and new view
    flex.SideNav.Content.add(
      <VoicemailNavButton key="voicemail-sidenav-button" />, { sortOrder: 2 }
    );

    // Add news view to the ViewCollection
    flex.ViewCollection.Content.add(
      <View name="voicemail-view" key="voicemail-view">
        <VoicemailView key="co-vm-view" />
      </View>
    );

    //end init
  }


  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
