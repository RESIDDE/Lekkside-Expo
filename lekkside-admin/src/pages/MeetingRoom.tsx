

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { decodePassphrase } from '../integrations/livekit/lib/client-utils';
import { KeyboardShortcuts } from '../integrations/livekit/lib/KeyboardShortcuts';
import { RecordingIndicator } from '../integrations/livekit/lib/RecordingIndicator';
import { SettingsMenu } from '../integrations/livekit/lib/SettingsMenu';
import { ModerationPanel } from '../integrations/livekit/lib/ModerationPanel';
import { ReactionsOverlay } from '../integrations/livekit/lib/ReactionsOverlay';
import { ReactionControls } from '../integrations/livekit/lib/ReactionControls';
import { ConnectionDetails } from '../integrations/livekit/lib/types';
import { ModeratorProvider, useModerator } from '../integrations/livekit/lib/ModeratorContext';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  PreJoin,
  RoomContext,
  VideoConference,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';
import { useNavigate, useParams } from 'react-router-dom';
import { useSetupE2EE } from '../integrations/livekit/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '../integrations/livekit/lib/usePerfomanceOptimiser';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import './MeetingRoom.css';

const CONN_DETAILS_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`;
const SHOW_SETTINGS_MENU = true;

export default function MeetingRoom() {
  return (
    <ModeratorProvider>
      <MeetingRoomInner />
    </ModeratorProvider>
  );
}

function MeetingRoomInner() {
  const { roomName } = useParams<{ roomName: string }>();
  const { setIsModerator } = useModerator();
  
  // Default options that can be adjusted later
  const region = undefined;
  const hq = true;
  const codec = 'vp9' as VideoCodec;
  const singlePeerConnection = false;
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );
  const [hasLeft, setHasLeft] = React.useState(false);

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setPreJoinChoices(values);
    if (!roomName) return;
    const url = new URL(CONN_DETAILS_ENDPOINT);
    url.searchParams.append('roomName', roomName);
    url.searchParams.append('participantName', values.username);
    if (region) {
      url.searchParams.append('region', region);
    }
    
    // Get current session for Authorization header
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const hostSecret = localStorage.getItem(`host_secret_${roomName}`) || undefined;

    const connectionDetailsResp = await fetch(url.toString(), { 
      method: 'POST',
      headers,
      body: JSON.stringify({
        roomName,
        participantName: values.username,
        ...(region && { region }),
        ...(hostSecret && { hostSecret })
      })
    });
    const connectionDetailsData = await connectionDetailsResp.json();
    
    if (connectionDetailsData.isModerator) {
      setIsModerator(true);
    }
    
    localStorage.setItem(`livekit_token_${roomName}`, connectionDetailsData.participantToken);
    setConnectionDetails(connectionDetailsData);
  }, [roomName, region, setIsModerator]);
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  return (
    <main data-lk-theme="default" className="meeting-room-container">
      {hasLeft ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ backgroundColor: '#111', padding: '40px 60px', borderRadius: '24px', textAlign: 'center', border: '1px solid #333' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Meeting Ended</h2>
            <p style={{ color: '#aaa', marginBottom: '32px' }}>You have successfully left the video meeting.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.close()} 
                style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}
              >
                Close Window
              </button>
              <button 
                onClick={() => window.location.reload()} 
                style={{ padding: '12px 24px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Rejoin Meeting
              </button>
            </div>
          </div>
        </div>
      ) : connectionDetails === undefined || preJoinChoices === undefined ? (
        <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
          <PreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
          />
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{
            codec: codec,
            hq: hq,
            singlePeerConnection: singlePeerConnection,
          }}
          onLeave={() => {
            window.close();
            setHasLeft(true);
          }}
        />
      )}
    </main>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
    singlePeerConnection: boolean;
  };
  onLeave?: () => void;
}) {
  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee: keyProvider && worker && e2eeEnabled ? { keyProvider, worker } : undefined,
      singlePeerConnection: props.options.singlePeerConnection,
    };
  }, [props.userChoices, props.options.hq, props.options.codec]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  const { setIsModerator } = useModerator();

  React.useEffect(() => {
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              alert(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }

    const handleMetadataChanged = (metadata: string | undefined, participant: any) => {
      if (participant.identity === room.localParticipant.identity && metadata) {
        try {
          const data = JSON.parse(metadata);
          if (data.isModerator) {
            setIsModerator(true);
          }
        } catch (e) {
          // ignore
        }
      }
    };
    room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);
    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);
    }
  }, [e2eeEnabled, room, e2eePassphrase, setIsModerator]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    room.on(RoomEvent.MediaDevicesError, handleError);

    if (e2eeSetupComplete) {
      room
        .connect(
          props.connectionDetails.serverUrl,
          props.connectionDetails.participantToken,
          connectOptions,
        )
        .catch((error) => {
          handleError(error);
        });
      if (props.userChoices.videoEnabled) {
        room.localParticipant.setCameraEnabled(true).catch((error) => {
          handleError(error);
        });
      }
      if (props.userChoices.audioEnabled) {
        room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          handleError(error);
        });
      }
    }
    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [e2eeSetupComplete, room, props.connectionDetails, props.userChoices]);

  const lowPowerMode = useLowCPUOptimizer(room);

  const navigate = useNavigate();
  const handleOnLeave = React.useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    if (returnUrl) {
      window.location.href = returnUrl;
    } else if (props.onLeave) {
      props.onLeave();
    } else {
      window.close();
      // Force reload to current URL if window close fails, or show message
      document.body.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #000; color: #fff; font-family: system-ui, sans-serif;"><div style="background-color: #111; padding: 40px 60px; border-radius: 24px; text-align: center; border: 1px solid #333;"><h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Meeting Ended</h2><p style="color: #aaa; margin-bottom: 32px;">You have successfully left the video meeting.</p><div style="display: flex; gap: 16px; justify-content: center;"><button onclick="window.close()" style="padding: 12px 24px; background-color: #333; color: #fff; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Close Window</button><button onclick="window.location.reload()" style="padding: 12px 24px; background-color: #fff; color: #000; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Rejoin Meeting</button></div></div></div>';
    }
  }, [props.onLeave]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details: ${error.message}`);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn('Low power mode enabled');
    }
  }, [lowPowerMode]);

  return (
    <div className="lk-room-container" style={{ flex: 1, position: 'relative' }}>
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
        />
        <RecordingIndicator />
        <ModerationPanel />
        <ReactionsOverlay />
        <ReactionControls />
      </RoomContext.Provider>
    </div>
  );
}
