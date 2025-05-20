import React, { ChangeEvent, FormEvent, useState } from 'react';
import {
  Typography,
  makeStyles,
  TextField,
  Grid,
  Button,
  InputLabel,
  Theme,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';
import { useAppState } from '../../../state';

import watchRTC from '@testrtc/watchrtc-sdk';

const useStyles = makeStyles((theme: Theme) => ({
  gutterBottom: {
    marginBottom: '1em',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: '1.5em 0 3.5em',
    '& div:not(:last-child)': {
      marginRight: '1em',
    },
    [theme.breakpoints.down('sm')]: {
      margin: '1.5em 0 2em',
    },
  },
  inputFieldsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1em',
    '& div:not(:last-child)': {
      marginRight: '1em',
    },
  },
  textFieldContainer: {
    width: '100%',
  },
  continueButton: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

interface RoomNameScreenProps {
  name: string;
  roomName: string;
  setName: (name: string) => void;
  setRoomName: (roomName: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setCaptureFeedback: (value: boolean) => void;
}

export default function RoomNameScreen({
  name,
  roomName,
  setName,
  setRoomName,
  handleSubmit,
  setCaptureFeedback,
}: RoomNameScreenProps) {
  const classes = useStyles();
  const { user } = useAppState();
  const [isChecked, setIsChecked] = useState(false);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleRoomNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRoomName(event.target.value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsChecked(newValue);
    setCaptureFeedback(newValue);
  };

  const hasUsername = !window.location.search.includes('customIdentity=true') && user?.displayName;

  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Join a Room
      </Typography>
      <Typography variant="body1">
        {hasUsername
          ? "Enter the name of a room you'd like to join."
          : "Enter your name and the name of a room you'd like to join"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <div className={classes.inputContainer}>
          <div className={classes.inputFieldsContainer}>
            {!hasUsername && (
              <div className={classes.textFieldContainer}>
                <InputLabel shrink htmlFor="input-user-name">
                  Your Name
                </InputLabel>
                <TextField
                  id="input-user-name"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={name}
                  onChange={handleNameChange}
                />
              </div>
            )}
            <div className={classes.textFieldContainer}>
              <InputLabel shrink htmlFor="input-room-name">
                Room Name
              </InputLabel>
              <TextField
                autoCapitalize="false"
                id="input-room-name"
                variant="outlined"
                fullWidth
                size="small"
                value={roomName}
                onChange={handleRoomNameChange}
              />
            </div>
          </div>
          <div>
            <FormControlLabel
              control={<Checkbox checked={isChecked} onChange={handleCheckboxChange} color="primary" />}
              label="Capture Rating"
            />
          </div>
        </div>
        <Grid container justifyContent="flex-end">
          <Button
            variant="contained"
            type="button"
            color="primary"
            className={classes.continueButton}
            style={{ marginRight: 5 }}
            onClick={e => {
              e.preventDefault();
              watchRTC.addEvent({
                type: 'local',
                name: 'watchRTC event sample',
              });
            }}
          >
            watchRTC event sample
          </Button>
          <Button
            variant="contained"
            type="submit"
            color="primary"
            disabled={!name || !roomName}
            className={classes.continueButton}
          >
            Continue
          </Button>
        </Grid>
      </form>
    </>
  );
}
