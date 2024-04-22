import React from 'react';
import * as queryString from 'query-string';

import { styled, Theme } from '@material-ui/core/styles';

import MenuBar from './components/MenuBar/MenuBar';
import MobileTopMenuBar from './components/MobileTopMenuBar/MobileTopMenuBar';
import PreJoinScreens from './components/PreJoinScreens/PreJoinScreens';
import ReconnectingNotification from './components/ReconnectingNotification/ReconnectingNotification';
import Room from './components/Room/Room';

import useHeight from './hooks/useHeight/useHeight';
import useRoomState from './hooks/useRoomState/useRoomState';

import watchRTC from '@testrtc/watchrtc-sdk';

const Container = styled('div')({
  display: 'grid',
  gridTemplateRows: '1fr auto',
});

const Main = styled('main')(({ theme }: { theme: Theme }) => ({
  overflow: 'hidden',
  paddingBottom: `${theme.footerHeight}px`, // Leave some space for the footer
  background: 'black',
  [theme.breakpoints.down('sm')]: {
    paddingBottom: `${theme.mobileFooterHeight + theme.mobileTopBarHeight}px`, // Leave some space for the mobile header and footer
  },
}));

const getCollectionInterval = () => {
  const ci = queryString.parse(window.location.search)?.collectionInterval as string;
  try {
    const ciNum = parseInt(ci);
    if (ciNum % 1000 === 0) {
      return ciNum;
    }
    return undefined;
  } catch {
    //
    return undefined;
  }
};

const getSplitChannels = () => {
  const sc = queryString.parse(window.location.search)?.splitChannels as string;
  return sc === 'true';
};

export default function App() {
  const roomState = useRoomState();

  // Here we would like the height of the main container to be the height of the viewport.
  // On some mobile browsers, 'height: 100vh' sets the height equal to that of the screen,
  // not the viewport. This looks bad when the mobile browsers location bar is open.
  // We will dynamically set the height with 'window.innerHeight', which means that this
  // will look good on mobile browsers even after the location bar opens or closes.
  const height = useHeight();

  React.useEffect(() => {
    watchRTC.init({ collectionInterval: getCollectionInterval(), splitChannels: getSplitChannels() } as any);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('metric') && Boolean(urlParams.get('metric'))) {
      watchRTC.addStatsListener(stats => {
        console.log('%cMETRIC', `background: ${'green'}; color: black; padding: 2px 0.5em; border-radius: 0.5em;`, {
          stats,
        });
      });
    }
    if (urlParams.has('state') && Boolean(urlParams.get('state'))) {
      watchRTC.addStateListener(state => {
        console.log('%cSTATE', `background: ${'orange'}; color: black; padding: 2px 0.5em; border-radius: 0.5em;`, {
          state,
        });
      });
    }
  }, []);

  return (
    <Container style={{ height }}>
      {roomState === 'disconnected' ? (
        <PreJoinScreens />
      ) : (
        <Main>
          <ReconnectingNotification />
          <MobileTopMenuBar />
          <Room />
          <MenuBar />
        </Main>
      )}
    </Container>
  );
}
