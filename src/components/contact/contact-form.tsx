"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.email("Please enter a valid email address."),
  interest: z.string().min(1, "Please select an area of interest."),
  message: z.string().min(10, "Please tell us a little more."),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      interest: "",
      message: "",
    },
  });

  if (submitted) {
    return (
      <div className="border-border bg-stone border p-8 sm:p-10">
        <p className="eyebrow">Thank you</p>
        <h2 className="text-ink mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.035em]">
          We will be in touch.
        </h2>
        <p className="text-muted-foreground mt-5 text-sm leading-6">
          A member of our studio team will respond within two business days.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(() => setSubmitted(true))}
    >
      <Field label="Name" error={errors.name?.message}>
        <input className="form-control" {...register("name")} />
      </Field>
      <Field label="Email address" error={errors.email?.message}>
        <input className="form-control" type="email" {...register("email")} />
      </Field>
      <Field label="I am interested in" error={errors.interest?.message}>
        <select className="form-control" {...register("interest")}>
          <option value="">Select an option</option>
          <option value="fitting">Booking a fitting</option>
          <option value="collection">The collection</option>
          <option value="order">An existing order</option>
        </select>
      </Field>
      <Field label="How can we help?" error={errors.message?.message}>
        <textarea
          className="form-control min-h-36 resize-y"
          {...register("message")}
        />
      </Field>
      <button className="button-primary mt-2 w-fit" type="submit">
        Send inquiry
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-ink grid gap-2 text-sm font-bold tracking-[0.1em] uppercase">
      {label}
      {children}
      {error ? (
        <span className="text-destructive text-sm font-medium tracking-normal normal-case">
          {error}
        </span>
      ) : null}
    </label>
  );
}
