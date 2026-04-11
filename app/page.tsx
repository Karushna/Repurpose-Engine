import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-semibold">
            Repurposing Engine
          </Link>

          <Link
            href="/app"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Try it
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-block rounded-full border px-3 py-1 text-sm text-gray-600">
              Repurpose once. Publish everywhere.
            </span>

            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Turn one piece of content into ready-to-publish social posts.
            </h1>

            <p className="max-w-xl text-lg text-gray-600">
              Paste a blog post, launch update, long-form note, or article
              content. Generate LinkedIn, X, and Instagram posts in seconds,
              then schedule them with Buffer.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/app"
                className="rounded-xl bg-black px-5 py-3 font-medium text-white"
              >
                Try it
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border px-5 py-3 font-medium"
              >
                How it works
              </a>
            </div>

            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Input</p>
                <p className="mt-2 text-sm text-gray-600">
                  Blog posts, launch notes, long-form content
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Output</p>
                <p className="mt-2 text-sm text-gray-600">
                  LinkedIn, X, and Instagram variants
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Publishing</p>
                <p className="mt-2 text-sm text-gray-600">
                  Add to Buffer queue or schedule later
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-gray-50 p-6 shadow-sm">
            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-4">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Source content
                </p>
                <p className="text-sm text-gray-700">
                  We launched a new AI tool for startup founders that turns
                  long-form updates into social media content...
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-white p-4">
                  <p className="mb-2 text-sm font-semibold">LinkedIn</p>
                  <p className="text-sm text-gray-600">
                    Professional post generated from your source content.
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-4">
                  <p className="mb-2 text-sm font-semibold">X</p>
                  <p className="text-sm text-gray-600">
                    Short, punchy post tailored for fast engagement.
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-4">
                  <p className="mb-2 text-sm font-semibold">Instagram</p>
                  <p className="text-sm text-gray-600">
                    Caption-style version ready for publishing.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <p className="text-sm font-medium text-gray-500">
                  Publish with Buffer
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Choose a channel, add to queue, or schedule for later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-2xl space-y-3">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="text-gray-600">
              A simple workflow for turning long-form content into social posts.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6">
              <p className="mb-3 text-sm font-semibold text-gray-500">
                Step 1
              </p>
              <h3 className="text-lg font-semibold">Paste your content</h3>
              <p className="mt-2 text-sm text-gray-600">
                Add your blog post, launch note, article text, or any long-form
                source content.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <p className="mb-3 text-sm font-semibold text-gray-500">
                Step 2
              </p>
              <h3 className="text-lg font-semibold">Generate platform posts</h3>
              <p className="mt-2 text-sm text-gray-600">
                Create tailored LinkedIn, X, and Instagram versions instantly.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <p className="mb-3 text-sm font-semibold text-gray-500">
                Step 3
              </p>
              <h3 className="text-lg font-semibold">Queue or schedule</h3>
              <p className="mt-2 text-sm text-gray-600">
                Review the content, choose your Buffer channel, and publish it
                the way you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border bg-black px-8 py-10 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  Start repurposing your content
                </h2>
                <p className="text-sm text-gray-300">
                  Generate content variations in seconds and publish with Buffer.
                </p>
              </div>

              <Link
                href="/app"
                className="inline-flex rounded-xl bg-white px-5 py-3 font-medium text-black"
              >
                Try it now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}