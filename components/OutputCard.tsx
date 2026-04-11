import { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function OutputCard({ title, children }: Props) {
  return (
    <section className="rounded-2xl border p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}