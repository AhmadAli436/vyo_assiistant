'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

function formatTranscript(transcript) {
  if (transcript == null) return '';
  if (typeof transcript === 'string') return transcript;
  if (Array.isArray(transcript)) {
    return transcript
      .map((x) => {
        if (x && typeof x === 'object' && 'content' in x) return `${x.role || ''}: ${x.content}`;
        return String(x);
      })
      .join('\n');
  }
  return String(transcript);
}

export default function Page() {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const clientRef = useRef(null);

  const ensureClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new RetellWebClient();
    }
    return clientRef.current;
  }, []);

  const startCall = useCallback(async () => {
    const client = ensureClient();
    setStatus('connecting');
    setErrorMessage('');
    setTranscript('');

    try {
      const res = await fetch('/api/create-web-call', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to create call');
        return;
      }

      client.on('call_started', () => setStatus('active'));
      client.on('call_ready', () => setStatus('ready'));
      client.on('call_ended', () => {
        setStatus('idle');
        client.removeAllListeners?.();
      });
      client.on('agent_start_talking', () => {});
      client.on('agent_stop_talking', () => {});
      client.on('update', (update) => {
        if (update?.transcript != null) {
          setTranscript(formatTranscript(update.transcript));
        }
      });
      client.on('error', (err) => {
        setStatus('error');
        setErrorMessage(err?.message ?? 'Call error');
      });

      await client.startCall({ accessToken: data.access_token });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err?.message ?? 'Failed to start call');
    }
  }, [ensureClient]);

  const stopCall = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      client.stopCall();
      setStatus('idle');
      setErrorMessage('');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.stopCall();
      }
    };
  }, []);

  const isCallActive = status === 'connecting' || status === 'ready' || status === 'active';

  const handleBallClick = () => {
    if (isCallActive) stopCall();
    else startCall();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button
          type="button"
          onClick={handleBallClick}
          style={{
            ...styles.ball,
            ...(isCallActive ? styles.ballActive : {}),
            ...(status === 'connecting' ? styles.ballConnecting : {}),
            ...(status === 'error' ? styles.ballError : {}),
          }}
          aria-label={isCallActive ? 'End call' : 'Start call'}
        >
          <span style={styles.ballIcon}>{isCallActive ? '◆' : '▶'}</span>
        </button>
        <p style={styles.status}>
          {status === 'idle' && 'Tap to talk'}
          {status === 'connecting' && 'Connecting…'}
          {status === 'ready' && 'Speak'}
          {status === 'active' && 'Listening'}
          {status === 'error' && (errorMessage || 'Error')}
        </p>
      </div>

      {transcript ? (
        <div style={styles.transcript}>
          <pre style={styles.transcriptText}>{formatTranscript(transcript)}</pre>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  ball: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
  },
  ballActive: {
    background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 100%)',
    boxShadow: '0 12px 40px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  ballConnecting: {
    background: 'linear-gradient(145deg, #eab308 0%, #ca8a04 100%)',
    boxShadow: '0 12px 40px rgba(234, 179, 8, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  ballError: {
    background: 'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)',
    boxShadow: '0 12px 40px rgba(239, 68, 68, 0.4)',
  },
  ballIcon: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 28,
    marginLeft: 4,
    lineHeight: 1,
  },
  status: {
    margin: 0,
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: 500,
  },
  transcript: {
    maxWidth: 420,
    width: '100%',
    padding: 16,
    background: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 16,
    fontSize: 13,
    maxHeight: 200,
    overflow: 'auto',
  },
  transcriptText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#d4d4d8',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 1.5,
  },
};
