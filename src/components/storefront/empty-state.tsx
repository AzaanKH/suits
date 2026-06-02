import Link from "next/link";

type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
};

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className="mx-auto max-w-xl py-12 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="text-ink mt-5 font-serif text-6xl leading-[0.95] tracking-[-0.04em]">
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
