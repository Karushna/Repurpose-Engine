"use client";

import { useEffect, useState } from "react";
import ContentInput from "@/components/ContentInput";
import GenerateButton from "@/components/GenerateButton";
import OutputCard from "@/components/OutputCard";
import OutputEditor from "@/components/OutputEditor";
import ChannelSelector from "@/components/ChannelSelector";
import PublishPanel from "@/components/PublishPanel";
import type { GenerateResponse, GeneratedPosts } from "@/lib/types";

type BufferChannel = {
  id: string;
  name: string;
  displayName?: string | null;
  service: string;
};

const starterText = `We launched a new AI tool for startup founders that turns long-form updates into social media content. It helps founders repurpose launch notes, blog posts, webinars, and internal updates into LinkedIn posts, X posts, and Instagram captions. The goal is to save time, stay consistent, and publish across channels without hiring a full content team.`;

export default function HomePage() {
  const [content, setContent] = useState(starterText);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<GeneratedPosts | null>(null);

  const [channels, setChannels] = useState<BufferChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [channelsError, setChannelsError] = useState("");

  const [publishMode, setPublishMode] = useState<"queue" | "schedule">("queue");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<
    "linkedin" | "xPost" | "instagram"
  >("linkedin");

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/buffer/channels");
        const data = await res.json();

        if (!data.success) {
          setChannelsError(data.error || "Failed to load Buffer channels");
          return;
        }

        setChannels(data.data.channels);
      } catch (err) {
        console.error(err);
        setChannelsError("Failed to load Buffer channels");
      }
    }

    loadChannels();
  }, []);

  async function handleGenerate() {
    setIsLoading(true);
    setError("");
    setPublishMessage("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data: GenerateResponse = await res.json();

      if (!data.success) {
        setOutputs(null);
        setError(data.error);
        return;
      }

      setOutputs(data.data);
    } catch (err) {
      console.error(err);
      setOutputs(null);
      setError("Something went wrong while generating posts.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublish() {
    if (!outputs) return;

    const text = outputs[selectedPlatform];

    setIsPublishing(true);
    setPublishMessage("");

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          text,
          publishMode,
          scheduledAt: publishMode === "schedule" ? scheduledAt : undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setPublishMessage(data.error || "Failed to publish");
        return;
      }

      setPublishMessage("Post sent to Buffer successfully.");
    } catch (err) {
      console.error(err);
      setPublishMessage("Failed to publish post.");
    } finally {
      setIsPublishing(false);
    }
  }

  function updateLinkedIn(value: string) {
    setOutputs((prev) => (prev ? { ...prev, linkedin: value } : prev));
  }

  function updateXPost(value: string) {
    setOutputs((prev) => (prev ? { ...prev, xPost: value } : prev));
  }

  function updateInstagram(value: string) {
    setOutputs((prev) => (prev ? { ...prev, instagram: value } : prev));
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Repurposing Engine</h1>
        <p className="text-sm text-gray-600">
          Generate and publish LinkedIn, X, and Instagram posts through Buffer.
        </p>
      </div>

      <div className="space-y-6">
        <ContentInput value={content} onChange={setContent} />

        <GenerateButton
          isLoading={isLoading}
          onClick={handleGenerate}
          disabled={content.trim().length < 50}
        />

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {channelsError && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700">
            {channelsError}
          </div>
        )}

        {!!channels.length && (
          <ChannelSelector
            channels={channels}
            value={selectedChannelId}
            onChange={setSelectedChannelId}
          />
        )}

        {outputs && (
          <>
            <div className="rounded-2xl border p-4">
              <label className="mb-2 block text-sm font-medium">
                Which generated post do you want to publish?
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) =>
                  setSelectedPlatform(
                    e.target.value as "linkedin" | "xPost" | "instagram"
                  )
                }
                className="w-full rounded-xl border p-3 outline-none"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="xPost">X</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div className="grid gap-6">
              <OutputCard title="LinkedIn">
                <OutputEditor
                  label="LinkedIn Post"
                  value={outputs.linkedin}
                  onChange={updateLinkedIn}
                />
              </OutputCard>

              <OutputCard title="X">
                <OutputEditor
                  label="X Post"
                  value={outputs.xPost}
                  onChange={updateXPost}
                />
              </OutputCard>

              <OutputCard title="Instagram">
                <OutputEditor
                  label="Instagram Caption"
                  value={outputs.instagram}
                  onChange={updateInstagram}
                />
              </OutputCard>
            </div>

            <PublishPanel
              selectedChannelId={selectedChannelId}
              publishMode={publishMode}
              scheduledAt={scheduledAt}
              onPublishModeChange={setPublishMode}
              onScheduledAtChange={setScheduledAt}
              onPublish={handlePublish}
              isPublishing={isPublishing}
              disabled={!selectedChannelId}
            />

            {publishMessage && (
              <div className="rounded-xl border p-3 text-sm">
                {publishMessage}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}