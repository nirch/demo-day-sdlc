import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as judgeInviteService from '../services/judgeInviteService';
import Button from './Button';

export default function InviteJudgeSection({ eventId }) {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = token
    ? `${window.location.origin}/judge-invite/${token}`
    : null;

  const fetchToken = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await judgeInviteService.getInviteToken(eventId);
      setToken(data.judge_invite_token);
    } catch {
      setFetchError('Couldn\u2019t load invite link.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setFetchError(null);
    try {
      const data = await judgeInviteService.generateInviteToken(eventId);
      setToken(data.judge_invite_token);
    } catch {
      setFetchError('Couldn\u2019t generate invite link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFetchError('Couldn\u2019t copy to clipboard.');
    }
  };

  if (isLoading) {
    return (
      <section className="mt-16" aria-label="Invite Judges">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-24 bg-gray-200 rounded w-full" />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16" aria-label="Invite Judges">
      <h2 className="text-xl font-semibold tracking-tight text-text-primary mb-4">
        Invite Judges
      </h2>

      {fetchError && (
        <p className="text-xs text-red-500 mb-4" role="alert">{fetchError}</p>
      )}

      {!token ? (
        <Button
          onClick={handleGenerate}
          isLoading={isGenerating}
        >
          Generate Invite Link
        </Button>
      ) : (
        <div className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted block mb-[6px]">
                Invite Link
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="
                    bg-bg-input text-text-primary text-sm font-medium
                    px-3 py-2 rounded-sm
                    border-[1.5px] border-border-input
                    flex-1 min-w-0
                  "
                  onClick={(e) => e.target.select()}
                />
                <Button variant="secondary" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-2">
              <QRCodeSVG
                value={inviteUrl}
                size={200}
                level="M"
                className="rounded-sm"
              />
              <p className="text-xs text-text-muted">
                Scan to open the invite link
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                onClick={handleGenerate}
                isLoading={isGenerating}
              >
                Regenerate Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
