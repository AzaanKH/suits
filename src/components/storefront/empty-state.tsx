import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em]">
        {title}
      </h1>
      <p className="text-muted-foreground mx-auto mt-5 max-w-md text-sm leading-6">
        {description}
      </p>
      <Link className="button-primary mt-8" href={action.href}>
        {action.label}
      </Link>
    </section>
  );
}
