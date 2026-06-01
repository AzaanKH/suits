import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="bg-muted/30 min-h-screen">
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">Suits</span>
            <Badge variant="secondary">Foundation</Badge>
          </div>
          <Button variant="outline">Browse collection</Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
        <section className="space-y-6">
          <Badge>Modern tailoring</Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
              A clean foundation for a better suit buying experience.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg leading-8">
              The storefront is ready for the next iteration: focused routes,
              reusable UI primitives, and room for commerce features without
              carrying forward the prototype architecture.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">View collection</Button>
            <Button size="lg" variant="outline">
              Start a fitting
            </Button>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Application foundation</CardTitle>
            <CardDescription>
              The first pass keeps the product surface intentionally small.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4">
            {[
              "Next.js App Router",
              "Tailwind CSS",
              "shadcn/ui primitives",
              "Typed test setup",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span>{item}</span>
                <Badge variant="outline">Ready</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
