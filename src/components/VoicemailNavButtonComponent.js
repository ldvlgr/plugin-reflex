//src/components/VoicemailNavButtonComponent.js
import React from 'react';
import { SideLink, Actions } from '@twilio/flex-ui';
 
const VoicemailNavButton = ({ activeView }) => {
   function navigate() {
       Actions.invokeAction('NavigateToView', { viewName: 'voicemail-view'});
   }
 
   return (
       <SideLink
       showLabel={true}
       icon="Voice"
       iconActive="VoiceBold"
       isActive={activeView === 'voicemail-view'}
       onClick={navigate}>
       Voicemail
       </SideLink>
   )
}
export default VoicemailNavButton;