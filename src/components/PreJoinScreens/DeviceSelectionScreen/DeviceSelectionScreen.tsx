import React from 'react';
import { makeStyles, Typography, Grid, Button, Theme, Hidden } from '@material-ui/core';
import * as queryString from 'query-string';
import LocalVideoPreview from './LocalVideoPreview/LocalVideoPreview';
import SettingsMenu from './SettingsMenu/SettingsMenu';
import { Steps } from '../PreJoinScreens';
import ToggleAudioButton from '../../Buttons/ToggleAudioButton/ToggleAudioButton';
import ToggleVideoButton from '../../Buttons/ToggleVideoButton/ToggleVideoButton';
import { useAppState } from '../../../state';
import useVideoContext from '../../../hooks/useVideoContext/useVideoContext';

// import { wrapPeerConnectionEvent } from '../../../utils';

import watchRTC from '@testrtc/watchrtc-sdk';

const useStyles = makeStyles((theme: Theme) => ({
  gutterBottom: {
    marginBottom: '1em',
  },
  marginTop: {
    marginTop: '1em',
  },
  deviceButton: {
    width: '100%',
    border: '2px solid #aaa',
    margin: '1em 0',
  },
  localPreviewContainer: {
    paddingRight: '2em',
    [theme.breakpoints.down('sm')]: {
      padding: '0 2.5em',
    },
  },
  joinButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column-reverse',
      width: '100%',
      '& button': {
        margin: '0.5em 0',
      },
    },
  },
  mobileButtonBar: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '1.5em 0 1em',
    },
  },
  mobileButton: {
    padding: '0.8em 0',
    margin: 0,
  },
}));

interface DeviceSelectionScreenProps {
  name: string;
  roomName: string;
  setStep: (step: Steps) => void;
  captureFeedback: boolean;
}

export default function DeviceSelectionScreen({
  name,
  roomName,
  setStep,
  captureFeedback,
}: DeviceSelectionScreenProps) {
  const classes = useStyles();
  const { getToken, isFetching } = useAppState();
  const { connect, isAcquiringLocalTracks, isConnecting } = useVideoContext();
  const disableButtons = isFetching || isAcquiringLocalTracks || isConnecting;

  const logLevelQueryParam: 'silent' | 'debug' | 'info' | 'error' =
    (queryString.parse(window.location.search)?.logLevel as string) || ('info' as any);

  const proxyUrl = queryString.parse(window.location.search)?.proxyUrl as string;
  if (proxyUrl) {
    console.log('proxyUrl', proxyUrl);
  }

  const wrtcConfig = {
    rtcApiKey:
      (queryString.parse(window.location.search)?.apiKey as string) || (process.env.REACT_APP_RTC_API_KEY as string),
    rtcRoomId: roomName,
    rtcPeerId: name,
    keys: {
      searchPeer: name,
    },
    logLevel: logLevelQueryParam,
    proxyUrl,
    // console: {
    //   level: 'log',
    //   override: true,
    // },
  };

  React.useEffect(() => {
    watchRTC.setConfig({
      ...wrtcConfig,
      keys: {
        ...wrtcConfig?.keys,
        ...(getCustomKeys() || {}),
      },
    });

    // wrapPeerConnectionEvent(window, 'addstream', (e: any) => {
    //   if (e?.stream?.id) {
    //     watchRTC.mapStream(e?.stream?.id, name);
    //   }
    // });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = () => {
    getToken(name, roomName).then(token => connect(token));

    if (captureFeedback) {
      setTimeout(() => {
        let rating = (Math.floor(Math.random() * 5) + 1) as any;
        let message = `User rating is ${rating}`;
        console.log('random rating', { rating, message });

        const ratingFromQuery = queryString.parse(window.location.search)?.rating;
        const ratingMessageFromQuery = queryString.parse(window.location.search)?.ratingMessage;
        console.log('ratingFromQuery', { ratingFromQuery, ratingMessageFromQuery });

        if (typeof ratingFromQuery === 'string' && Number(ratingFromQuery)) {
          rating = Number(ratingFromQuery);
        }
        if (typeof ratingMessageFromQuery === 'string') {
          message = decodeURI(ratingMessageFromQuery);
        }
        console.log('rating', { rating, message });
        watchRTC.setUserRating(rating, message);
      }, 29000);
    }
  };

  const getCustomKeys = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encodedData = params.get('key');

      if (!encodedData) {
        return {};
      }

      const decodedData = decodeURIComponent(encodedData);
      let keys = JSON.parse(decodedData);

      return keys;
    } catch (err) {
      // @ts-ignore
      console.error(err.message);
      return {};
    }
  };

  const progressCallback = (progress: number) => {
    console.log(`SAMPLE:runNetworkTest progressCallback ${progress}%`, {});
  };

  function getJsonFromUrl(query: string) {
    if (query.indexOf('?') === 0) {
      query = query.substr(1);
    }

    const result: Record<string, string | string[]> = {};
    query.split('&').forEach(function(part) {
      if (!part) return;
      part = part.split('+').join(' ');
      const eq = part.indexOf('=');
      let key = eq > -1 ? part.substr(0, eq) : part;
      const val = eq > -1 ? decodeURIComponent(part.substr(eq + 1)) : '';
      const from = key.indexOf('[');
      if (from === -1) {
        result[decodeURIComponent(key)] = val;
      } else {
        const to = key.indexOf(']', from);
        const index = decodeURIComponent(key.substring(from + 1, to));
        key = decodeURIComponent(key.substring(0, from));
        if (!result[key]) {
          result[key] = [];
        }
        if (!index) {
          (result[key] as string[]).push(val);
        } else {
          // @ts-ignore
          result[key][index] = val;
        }
      }
    });
    return result;
  }

  const runNetworkTest = async () => {
    try {
      console.log(`SAMPLE:runNetworkTest Starting`, { watchRTC });
      const params = getJsonFromUrl(window.location.search);
      console.log(`muly:DeviceSelectionScreen:runNetworkTest`, { params });
      const answer = await watchRTC.qualityrtc.run({
        options: {
          ...params,
          // run: "Location",
          // if not provided, will use default unpkg.com values, used for local development
          // codeUrl: `http://localhost:8081/lib/main.bundle.js`,
          // should not be passed, and will read from watchRTC server, passing this for development testing
          // configUrl: `https://niceincontact.testrtc.com`,
        },
        progressCallback,
      });

      // any time can call stop to stop the test
      // watchRTC.qualityrtc.stop();

      console.log(`SAMPLE:runNetworkTest Completed`, { answer });
    } catch (error) {
      console.log(`SAMPLE:runNetworkTest Failure`, { error });
    }
  };

  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Join {roomName}
      </Typography>

      <Grid container justifyContent="center">
        <Grid item md={7} sm={12} xs={12}>
          <div className={classes.localPreviewContainer}>
            <LocalVideoPreview identity={name} />
          </div>
          <div className={classes.mobileButtonBar}>
            <Hidden mdUp>
              <ToggleAudioButton className={classes.mobileButton} disabled={disableButtons} />
              <ToggleVideoButton className={classes.mobileButton} disabled={disableButtons} />
            </Hidden>
            <SettingsMenu mobileButtonClass={classes.mobileButton} />
            <Button
              onClick={() => runNetworkTest()}
              style={{ marginTop: '2em' }}
              variant="contained"
              color="primary"
              data-cy-join-now
            >
              QRTC Test
            </Button>
          </div>
        </Grid>
        <Grid item md={5} sm={12} xs={12}>
          <Grid container direction="column" justifyContent="space-between" style={{ height: '100%' }}>
            <div>
              <Hidden smDown>
                <ToggleAudioButton className={classes.deviceButton} disabled={disableButtons} />
                <ToggleVideoButton className={classes.deviceButton} disabled={disableButtons} />
              </Hidden>
            </div>
            <div className={classes.joinButtons}>
              <Button variant="outlined" color="primary" onClick={() => setStep(Steps.roomNameStep)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                data-cy-join-now
                onClick={handleJoin}
                disabled={disableButtons}
              >
                Join Now
              </Button>
            </div>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
