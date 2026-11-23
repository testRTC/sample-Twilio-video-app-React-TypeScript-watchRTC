import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import watchRTC from '@testrtc/watchrtc-sdk';

import Button from '@material-ui/core/Button';
import ScreenShareIcon from '../../../icons/ScreenShareIcon';
import Tooltip from '@material-ui/core/Tooltip';

import useScreenShareParticipant from '../../../hooks/useScreenShareParticipant/useScreenShareParticipant';
import useVideoContext from '../../../hooks/useVideoContext/useVideoContext';
import { isAudioOnly } from '../../../utils/demoConfig';

export const SCREEN_SHARE_TEXT = 'Share Screen';
export const STOP_SCREEN_SHARE_TEXT = 'Stop Sharing Screen';
export const SHARE_IN_PROGRESS_TEXT = 'Cannot share screen when another user is sharing';
export const SHARE_NOT_SUPPORTED_TEXT = 'Screen sharing is not supported with this browser';
export const SHARE_AUDIO_ONLY_TEXT = 'Screen sharing is off in audio-only mode';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      margin: theme.spacing(1),
      '&[disabled]': {
        color: '#bbb',
        '& svg *': {
          fill: '#bbb',
        },
      },
    },
  })
);

export default function ToggleScreenShareButton(props: { disabled?: boolean }) {
  const classes = useStyles();
  const screenShareParticipant = useScreenShareParticipant();
  const { toggleScreenShare } = useVideoContext();
  const disableScreenShareButton = Boolean(screenShareParticipant);
  const isScreenShareSupported = navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
  // `?audioOnly=1` (FR8.4): a screen share would publish a video track, so it is not offered.
  const audioOnly = isAudioOnly();
  const isDisabled = props.disabled || disableScreenShareButton || !isScreenShareSupported || audioOnly;

  let tooltipMessage = '';

  if (disableScreenShareButton) {
    tooltipMessage = SHARE_IN_PROGRESS_TEXT;
  }

  if (!isScreenShareSupported) {
    tooltipMessage = SHARE_NOT_SUPPORTED_TEXT;
  }

  if (audioOnly) {
    tooltipMessage = SHARE_AUDIO_ONLY_TEXT;
  }

  const handleOnClick = () => {
    if (audioOnly) return;
    toggleScreenShare();
    watchRTC.addEvent({ type: 'local', name: 'Share Screen' });
  };

  return (
    <Tooltip
      title={tooltipMessage}
      placement="top"
      PopperProps={{ disablePortal: true }}
      style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
    >
      <span>
        {/* The span element is needed because a disabled button will not emit hover events and we want to display
          a tooltip when screen sharing is disabled */}
        <Button
          className={classes.button}
          onClick={handleOnClick}
          disabled={isDisabled}
          startIcon={<ScreenShareIcon />}
          data-cy-share-screen
        >
          {SCREEN_SHARE_TEXT}
        </Button>
      </span>
    </Tooltip>
  );
}
