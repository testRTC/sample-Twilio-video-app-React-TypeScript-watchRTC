import React, { useEffect, useState } from 'react';
import { makeStyles, Typography } from '@material-ui/core';

import { describeDetectSignal, subscribeToDetect } from '../../detect/detectIntegration';
import {
  addPayload,
  ConditionTimeline,
  DetectTimeline,
  raiseToClearMs,
  TimelineEvent,
} from '../../detect/detectTimeline';

/**
 * Minimal Detect panel (FR8.5): grouped by peer connection, then stream, with each condition's raise-to-clear
 * timeline for signal #1. No other signal tiles, no eMOS sparklines, no threshold value anywhere (FR8.4).
 * Rendered only when the demo Detect switch (`?detect=1`) is on. Fed only by the SDK's `onDetect` (S-120, R-222); a
 * `config_error` is never shown here (S-119, R-233).
 */

const useStyles = makeStyles({
  panel: {
    position: 'fixed',
    top: '1em',
    left: '1em',
    zIndex: 20,
    width: '360px',
    maxHeight: '60vh',
    overflowY: 'auto',
    padding: '0.75em',
    background: 'rgba(255, 255, 255, 0.92)',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  group: {
    marginTop: '0.5em',
  },
  stream: {
    marginLeft: '0.75em',
  },
  condition: {
    marginLeft: '0.75em',
    marginBottom: '0.4em',
  },
  list: {
    margin: 0,
    paddingLeft: '1.2em',
  },
});

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString();

const describeEvent = (event: TimelineEvent) => {
  const parts: string[] = [event.state];
  if (event.severity) parts.push(event.severity);
  if (event.window && event.question) parts.push(`${event.window}/${event.question}`);
  return `${formatTime(event.eventTimestamp)} ${parts.join(' ')}`;
};

/** A signal's title and description, from the SDK's `detect.describe()` (R-426); the panel writes no signal text. */
export type DescribeSignal = (signalId: string) => { title: string; description: string } | undefined;

function Condition({ condition, describe }: { condition: ConditionTimeline; describe?: DescribeSignal }) {
  const classes = useStyles();
  const durationMs = raiseToClearMs(condition);
  const status =
    durationMs !== undefined
      ? `raise to clear ${Math.round(durationMs / 1000)} s${condition.clearCause ? ` (${condition.clearCause})` : ''}`
      : 'open';
  const text = condition.signalId && describe ? describe(condition.signalId) : undefined;
  return (
    <div className={classes.condition} data-testid="detect-condition">
      <div>
        <strong>{text ? text.title : condition.signalId || 'unknown signal'}</strong> {condition.conditionId}: {status}
      </div>
      {text && <div>{text.description}</div>}
      <ol className={classes.list}>
        {condition.events.map((event, i) => (
          <li key={i}>{describeEvent(event)}</li>
        ))}
      </ol>
    </div>
  );
}

export function DetectPanelView({ timeline, describe }: { timeline: DetectTimeline; describe?: DescribeSignal }) {
  const classes = useStyles();
  return (
    <div className={classes.panel} data-testid="detect-panel">
      <Typography variant="subtitle2" component="div">
        Detect
      </Typography>
      {timeline.length === 0 && <div>No Detect events yet.</div>}
      {timeline.map(pc => (
        <div key={pc.peerConnectionId} className={classes.group}>
          <div>Peer connection {pc.peerConnectionId}</div>
          {pc.streams.map(stream => (
            <div key={stream.streamId} className={classes.stream}>
              <div>Stream {stream.streamId}</div>
              {stream.conditions.map(condition => (
                <Condition key={condition.conditionId} condition={condition} describe={describe} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function DetectPanel() {
  const [timeline, setTimeline] = useState<DetectTimeline>([]);

  useEffect(() => {
    const unsubscribe = subscribeToDetect(payload => setTimeline(current => addPayload(current, payload)));
    return unsubscribe;
  }, []);

  return <DetectPanelView timeline={timeline} describe={describeDetectSignal} />;
}
