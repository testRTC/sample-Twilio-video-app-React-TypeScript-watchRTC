import React from 'react';
import { makeStyles, Typography, Grid, Button, Theme, Hidden, Switch, Tooltip } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import * as queryString from 'query-string';
import LocalVideoPreview from './LocalVideoPreview/LocalVideoPreview';
import SettingsMenu from './SettingsMenu/SettingsMenu';
import { Steps } from '../PreJoinScreens';
import ToggleAudioButton from '../../Buttons/ToggleAudioButton/ToggleAudioButton';
import ToggleVideoButton from '../../Buttons/ToggleVideoButton/ToggleVideoButton';
import { useAppState } from '../../../state';
import useChatContext from '../../../hooks/useChatContext/useChatContext';
import useVideoContext from '../../../hooks/useVideoContext/useVideoContext';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { useKrispToggle } from '../../../hooks/useKrispToggle/useKrispToggle';
import SmallCheckIcon from '../../../icons/SmallCheckIcon';
import InfoIconOutlined from '../../../icons/InfoIconOutlined';

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
    marginBottom: '2em',
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
  toolTipContainer: {
    display: 'flex',
    alignItems: 'center',
    '& div': {
      display: 'flex',
      alignItems: 'center',
    },
    '& svg': {
      marginLeft: '0.3em',
    },
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
  const { getToken, isFetching, isKrispEnabled, isKrispInstalled } = useAppState();
  const { connect: chatConnect } = useChatContext();
  const { connect: videoConnect, isAcquiringLocalTracks, isConnecting } = useVideoContext();
  const { toggleKrisp } = useKrispToggle();
  const disableButtons = isFetching || isAcquiringLocalTracks || isConnecting;

  const logLevelQueryParam: 'silent' | 'debug' | 'info' | 'error' =
    (queryString.parse(window.location.search)?.logLevel as string) || ('info' as any);

  const proxyUrl = queryString.parse(window.location.search)?.proxyUrl as string;
  if (proxyUrl) {
    console.log('proxyUrl', proxyUrl);
  }

  const decodeIfEncoded = (str: string) => {
    try {
      const decodedStr = decodeURIComponent(str);
      if (encodeURIComponent(decodedStr) === str) {
        return decodedStr;
      } else {
        return str;
      }
    } catch (e) {
      return str;
    }
  };

  const wrtcConfig = React.useMemo(
    () => ({
      rtcApiKey:
        (queryString.parse(window.location.search)?.apiKey as string) || (process.env.REACT_APP_RTC_API_KEY as string),
      rtcRoomId: decodeIfEncoded(roomName),
      rtcPeerId: decodeIfEncoded(name),
      keys: {
        searchPeer: decodeIfEncoded(name),
      },
      logLevel: logLevelQueryParam,
      proxyUrl,
      // console: {
      //   level: 'log',
      //   override: true,
      // },
    }),
    [roomName, name, logLevelQueryParam, proxyUrl]
  );

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
  }, [wrtcConfig]);

  const handleJoin = () => {
    getToken(name, roomName).then(({ token }) => {
      videoConnect(token);
      process.env.REACT_APP_DISABLE_TWILIO_CONVERSATIONS !== 'true' && chatConnect(token);
    });

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

  if (isFetching || isConnecting) {
    return (
      <Grid container justifyContent="center" alignItems="center" direction="column" style={{ height: '100%' }}>
        <div>
          <CircularProgress variant="indeterminate" />
        </div>
        <div>
          <Typography variant="body2" style={{ fontWeight: 'bold', fontSize: '16px' }}>
            Joining Meeting
          </Typography>
        </div>
      </Grid>
    );
  }

  return (
    <>
      <Typography variant={roomName.length > 50 ? 'caption' : 'h5'} className={classes.gutterBottom}>
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
              <SettingsMenu mobileButtonClass={classes.mobileButton} />
            </Hidden>
          </div>
        </Grid>
        <Grid item md={5} sm={12} xs={12}>
          <Grid container direction="column" justifyContent="space-between" style={{ alignItems: 'normal' }}>
            <div>
              <Hidden smDown>
                <ToggleAudioButton className={classes.deviceButton} disabled={disableButtons} />
                <ToggleVideoButton className={classes.deviceButton} disabled={disableButtons} />
              </Hidden>
            </div>
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
          </Grid>
        </Grid>

        <Grid item md={12} sm={12} xs={12}>
          {isKrispInstalled && (
            <Grid
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              style={{ marginBottom: '1em' }}
            >
              <div className={classes.toolTipContainer}>
                <Typography variant="subtitle2">Noise Cancellation</Typography>
                <Tooltip
                  title="Suppress background noise from your microphone"
                  interactive
                  leaveDelay={250}
                  leaveTouchDelay={15000}
                  enterTouchDelay={0}
                >
                  <div>
                    <InfoIconOutlined />
                  </div>
                </Tooltip>
              </div>

              <FormControlLabel
                control={
                  <Switch
                    checked={!!isKrispEnabled}
                    checkedIcon={<SmallCheckIcon />}
                    disableRipple={true}
                    onClick={toggleKrisp}
                  />
                }
                label={isKrispEnabled ? 'Enabled' : 'Disabled'}
                style={{ marginRight: 0 }}
                // Prevents <Switch /> from being temporarily enabled (and then quickly disabled) in unsupported browsers after
                // isAcquiringLocalTracks becomes false:
                disabled={isKrispEnabled && isAcquiringLocalTracks}
              />
            </Grid>
          )}
          <Divider />
        </Grid>

        <Grid item md={12} sm={12} xs={12}>
          <Grid container direction="row" alignItems="center" style={{ marginTop: '1em' }}>
            <Hidden smDown>
              <Grid item md={7} sm={12} xs={12}>
                <SettingsMenu mobileButtonClass={classes.mobileButton} />
              </Grid>
            </Hidden>

            <Grid item md={5} sm={12} xs={12}>
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
      </Grid>
    </>
  );
}
