import { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function OutputCard({ title, children }: Props) {
  return (
    <section className="rounded-2xl border bg-gray-50 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}