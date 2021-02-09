import React from 'react';
import { VERSION, Actions, TaskHelper } from '@twilio/flex-ui';

import { FlexPlugin } from 'flex-plugin';

import CustomTaskListContainer from './components/CustomTaskList/CustomTaskList.Container';
import reducers, { namespace } from './states';

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

    const options = { sortOrder: -1 };
    flex.AgentDesktopView
      .Panel1
      .Content
      .add(<CustomTaskListContainer key="ReflexPlugin-component" />, options);


    //BLOCK TRANSFER TO SOME QUEUES

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



    //Queues should get loaded once in Flex
    //Move this code to -> manager.events.addListener('pluginsLoaded', () ={  });
    //or include in other init code
    const getQueues = () => new Promise(async (resolve) => {
      const query = await manager.insightsClient.instantQuery('tr-queue');
      query.on('searchResult', (items) => {
        resolve(items);
      });
      query.search('');
    });


    
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
          //Modify alert pop up message
          alert('No Agents Available.  Transfer canceled.');
          abortFunction();
        }
      }
    });


    //PLAY AUDIO ON INBOUND CALLS
    const audio = new Audio('https://api.twilio.com/cowbell.mp3');
    const playAudio = reservation => {
      audio.play();
      ['accepted', 'canceled', 'rejected', 'rescinded', 'timeout'].forEach(e => {
        reservation.on(e, () => audio.pause());
      });
    };

    manager.workerClient.on('reservationCreated', reservation => {
      console.log('reservationCreated: ', reservation);
      const isVoiceQueue = reservation.task.taskChannelUniqueName === 'voice';
      const isInboundTask = reservation.task.attributes.direction === 'inbound';
      if (isVoiceQueue && isInboundTask) {
        console.log('Task is incoming call');
        playAudio(reservation);
      }
    });




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
