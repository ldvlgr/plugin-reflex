//src/components/NewsViewComponent.js
import React, { Component } from 'react';
import { withTheme } from '@twilio/flex-ui';
import styled from 'react-emotion';



// voicemail component with styled structure and content
function VoicemailView () {
    return(
      <Canvas>
          <Container>
              <HeaderMain>
                  <Header>Voicemail Page</Header>
              </HeaderMain>
              <Header>Include VM UI here</Header>
          </Container>
      </Canvas>
    );          
  }
    
   // v3 - styled JSX element definitions
   const Canvas = styled("div")`
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      align-items: center;
      background-color: ${props => props.theme.colors.base3};    
    `;
    
   const Container = styled("div")`
      color: ${props => props.theme.calculated.textColor};    
      align-items: center;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      max-width: 100%;
    `;
    
   const HeaderMain = styled("div")`
      border-style: solid;
      border-width: 0px 0px 4px;
      border-color: ${props => props.theme.colors.defaultButtonColor};
      margin-bottom: 1.5em;
      font-size: 2em;
    `;
    const Header = styled("div")`
      font-size: 10px;
      font-weight: bold;
      color: ${props => props.theme.SideNav.Container.background};
      letter-spacing: 2px;
      margin: 0 2em;
      font-size: 2.5em;
      font-family: serif;   
    `;
    
  // v3 export withTheme
   export default withTheme(VoicemailView);