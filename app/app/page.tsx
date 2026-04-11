"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function AppPage() {
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

  async function publishText(text: string) {
    if (!selectedChannelId) {
      setPublishMessage("Please select a Buffer channel first.");
      return;
    }

    if (publishMode === "schedule" && !scheduledAt) {
      setPublishMessage("Please choose a schedule time.");
      return;
    }

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

  async function handleSharedPublish() {
    if (!outputs) {
      setPublishMessage("Generate posts first.");
      return;
    }

    const text = outputs[selectedPlatform];
    await publishText(text);
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
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href="/" className="text-lg font-semibold">
              Repurposing Engine
            </Link>
            <p className="text-sm text-gray-500">
              Generate social posts from long-form content
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Back to home
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 space-y-3">
          <span className="inline-block rounded-full border bg-white px-3 py-1 text-sm text-gray-600">
            Workspace
          </span>
          <h1 className="text-3xl font-bold">Repurpose your content</h1>
          <p className="max-w-2xl text-gray-600">
            Give your source content, blog text, product update, or article
            copy. We’ll generate LinkedIn, X, and Instagram versions that you
            can edit and publish through Buffer.
          </p>
        </div>

        <div className="grid gap-8">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="text-xl font-semibold">1. Give your source content</h2>
              <p className="text-sm text-gray-600">
                Paste long-form content, launch notes, article copy, or blog
                text below.
              </p>
            </div>

            <div className="space-y-4">
              <ContentInput value={content} onChange={setContent} />

              <div className="flex flex-wrap items-center gap-3">
                <GenerateButton
                  isLoading={isLoading}
                  onClick={handleGenerate}
                  disabled={content.trim().length < 50}
                />
                <p className="text-sm text-gray-500">
                  URL input can be added next. For now, paste the source text.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </section>

          {outputs && (
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-semibold">
                  2. Review and edit generated posts
                </h2>
                <p className="text-sm text-gray-600">
                  Each card contains one platform-ready version of your content.
                </p>
              </div>

              <div className="mb-6 rounded-2xl border p-4">
                <label className="mb-2 block text-sm font-medium">
                  Which version should the shared publish button use?
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

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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
            </section>
          )}

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="text-xl font-semibold">
                3. Choose Buffer channel and publish mode
              </h2>
              <p className="text-sm text-gray-600">
                Connect your generated content to a Buffer channel and either
                add it to the queue or schedule it.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
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

                {!channels.length && !channelsError && (
                  <div className="rounded-xl border p-3 text-sm text-gray-600">
                    Loading Buffer channels...
                  </div>
                )}
              </div>

              <PublishPanel
                selectedChannelId={selectedChannelId}
                publishMode={publishMode}
                scheduledAt={scheduledAt}
                onPublishModeChange={setPublishMode}
                onScheduledAtChange={setScheduledAt}
                onPublish={handleSharedPublish}
                isPublishing={isPublishing}
                disabled={!outputs}
              />
            </div>

            {publishMessage && (
              <div className="mt-4 rounded-xl border p-3 text-sm">
                {publishMessage}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}