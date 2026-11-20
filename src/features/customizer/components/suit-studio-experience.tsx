"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Compass,
  PanelRightClose,
  PanelRightOpen,
  RotateCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { EmptyState } from "@/components/storefront/empty-state";
import { calculateConfigurationPrice } from "@/features/customizer/pricing";
import {
  CUSTOMIZER_STEPS,
  type CustomizerGroupCode,
} from "@/features/customizer/steps";
import { formatCurrency } from "@/lib/product-format";
import { cn } from "@/lib/utils";
import { useCustomizerStore } from "@/store/customizer-store";

import { SUIT_MOODS, type SuitMood } from "../three-d/suit-model";
import {
  isStudioStepCode,
  STUDIO_STEP_CODES,
  type StudioStepCode,
} from "../three-d/suit-parts";
import { getSuit3dCapability } from "../three-d/device-support";
import {
  buildGalleryDesigns,
  type GalleryDesign,
} from "../three-d/suit-gallery-designs";
import {
  getSuit3dSelection,
  SUIT_3D_PRODUCT_SLUG,
} from "../three-d/suit-selection";
import type { StudioCapture, StudioView } from "../three-d/suit-studio-canvas";
import { useCustomizerCatalog } from "../use-customizer-catalog";
import { FabricStep, OptionGroupStep } from "./option-steps";
import {
  FloorHint,
  FloorPanel,
  getSpecTicket,
  rememberFloorVisit,
  SpecTicket,
  useFloorInvitation,
  WithSavedDesigns,
  type SavedDesignsState,
} from "./studio-floor";
import "./suit-studio.css";
import "./suit-studio-experience.css";

const SuitStudioCanvas = dynamic(
  () =>
    import("../three-d/suit-studio-canvas").then((mod) => mod.SuitStudioCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="studio-scene-loading" role="status">
        Preparing your suit
      </div>
    ),
  },
);

/** What the 3D can and cannot show for a step, so options that look alike make sense. */
const STEP_NOTES: Partial<Record<StudioStepCode, string>> = {
  trousers:
    "The jacket steps aside so you can see the waistband: belt loops, side adjusters or a pleat. Brace buttons sit inside the waistband.",
  extras:
    "The waistcoat shows inside the jacket. Working cuffs, a monogram and full canvas are made to your specification but not drawn.",
};

const DESKTOP_QUERY = "(min-width: 900px)";
const NO_INSETS = { right: 0, bottom: 0 };

export function SuitStudioExperience({ productSlug }: { productSlug: string }) {
  return (
    <WithSavedDesigns>
      {(savedDesigns) => (
        <StudioExperienceBody
          productSlug={productSlug}
          savedDesigns={savedDesigns}
        />
      )}
    </WithSavedDesigns>
  );
}

type FloorMode = "off" | "free" | "overview";

function StudioExperienceBody({
  productSlug,
  savedDesigns,
}: {
  productSlug: string;
  savedDesigns: SavedDesignsState;
}) {
  const { customizerData, catalog } = useCustomizerCatalog(productSlug);
  const configuration = useCustomizerStore((s) => s.configuration);
  const currentStepCode = useCustomizerStore((s) => s.currentStepCode);
  const dirty = useCustomizerStore((s) => s.dirty);
  const setStep = useCustomizerStore((s) => s.setStep);
  const wearDesign = useCustomizerStore((s) => s.wearDesign);
  const activeStep: StudioStepCode = isStudioStepCode(currentStepCode)
    ? currentStepCode
    : "fabric";
  // Until the visitor picks a lighting mood, follow the site theme.
  const { resolvedTheme } = useTheme();
  const [chosenMood, setMood] = useState<SuitMood | null>(null);
  const mood: SuitMood =
    chosenMood ?? (resolvedTheme === "dark" ? "evening" : "atelier");
  const [turntable, setTurntable] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [insets, setInsets] = useState({ right: 0, bottom: 0 });
  // A state ref, so measuring starts when the panel actually mounts (after the catalog loads).
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const captureRef = useRef<StudioCapture | null>(null);
  const stopTurntable = useCallback(() => setTurntable(false), []);

  // The studio floor: other suits the visitor can walk up to for ideas.
  const [floor, setFloor] = useState<FloorMode>("off");
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [hint, setHint] = useState<"hidden" | "found" | "dismissed">("hidden");
  const [lowPower] = useState(
    () => typeof window !== "undefined" && getSuit3dCapability().simplified,
  );
  const studioReady =
    Boolean(catalog && configuration) &&
    catalog?.product.slug === SUIT_3D_PRODUCT_SLUG;
  const inviteDue = useFloorInvitation(studioReady);
  const invited = inviteDue && floor === "off" && hint === "hidden";
  // Suits load (hidden) as soon as the visitor is invited, so they are ready to step out.
  const floorArmed = inviteDue || floor !== "off" || hint !== "hidden";
  const galleryDesigns = useMemo<GalleryDesign[]>(
    () =>
      floorArmed && catalog && configuration && studioReady
        ? buildGalleryDesigns(
            catalog,
            configuration,
            savedDesigns.designs,
            lowPower ? 4 : 7,
          )
        : [],
    [
      floorArmed,
      catalog,
      configuration,
      studioReady,
      savedDesigns.designs,
      lowPower,
    ],
  );
  const gallery = useMemo(
    () =>
      galleryDesigns.map((design) => ({
        id: design.id,
        name: design.name,
        sourceLabel: design.sourceLabel,
        selection: getSuit3dSelection(design.configuration),
      })),
    [galleryDesigns],
  );
  const inspectedIndex = galleryDesigns.findIndex((d) => d.id === inspectedId);
  const inspected = galleryDesigns[inspectedIndex] ?? null;
  const view = useMemo<StudioView>(() => {
    if (floor !== "off" && inspectedIndex >= 0)
      return {
        kind: "inspect",
        index: inspectedIndex,
        count: galleryDesigns.length,
      };
    if (floor === "overview") return { kind: "overview" };
    if (floor === "free") return { kind: "free" };
    return { kind: "fit" };
  }, [floor, inspectedIndex, galleryDesigns.length]);

  const enterFloor = useCallback((mode: Exclude<FloorMode, "off">) => {
    rememberFloorVisit();
    // The turntable orbits the visitor's suit; on the floor it would fight the camera.
    setTurntable(false);
    setFloor(mode);
    setHint((current) => (current === "dismissed" ? current : "found"));
  }, []);
  const leaveFloor = useCallback(() => {
    setFloor("off");
    setInspectedId(null);
    setHint((current) => (current === "found" ? "dismissed" : current));
  }, []);
  // Turning the camera after the invitation is the cue to reveal the room.
  const onCameraStart = useCallback(() => {
    if (invited) enterFloor("free");
  }, [invited, enterFloor]);
  const inspect = useCallback(
    (id: string | null) => {
      if (id) enterFloor(floor === "off" ? "free" : floor);
      // Back to the lineup: step back to the overview, not stay in a close-up.
      else setFloor("overview");
      setInspectedId(id);
    },
    [enterFloor, floor],
  );
  const selectStep = useCallback(
    (step: StudioStepCode) => {
      leaveFloor();
      setStep(step);
    },
    [leaveFloor, setStep],
  );

  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // The panel floats over the scene; report how much it covers so the camera can re-center.
  useLayoutEffect(() => {
    if (!panel || !panelOpen) return;
    const measure = () => {
      const rect = panel.getBoundingClientRect();
      setInsets(
        window.matchMedia(DESKTOP_QUERY).matches
          ? { right: window.innerWidth - rect.left, bottom: 0 }
          : { right: 0, bottom: window.innerHeight - rect.top },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [panel, panelOpen]);

  if (customizerData === undefined || (customizerData.product && !catalog)) {
    return (
      <div className="suit-atelier">
        <div className="studio-scene-loading" role="status">
          Preparing your suit
        </div>
      </div>
    );
  }

  if (customizerData.product === null || !catalog || !configuration) {
    return (
      <div className="suit-atelier is-message">
        <EmptyState
          title="Suit not found."
          description="This suit is unavailable or is no longer part of the active collection."
          headingTag="h1"
          action={{ label: "Return to the collection", href: "/shop" }}
        />
      </div>
    );
  }

  const customizeHref = `/customize/${catalog.product.slug}`;

  if (catalog.product.slug !== SUIT_3D_PRODUCT_SLUG) {
    return (
      <div className="suit-atelier is-message">
        <EmptyState
          title="The studio is not available for this suit yet."
          description="You can still design it with the full customizer."
          headingTag="h1"
          action={{ label: "Open the customizer", href: customizeHref }}
        />
      </div>
    );
  }

  const price = calculateConfigurationPrice(catalog, configuration);

  function wear(design: GalleryDesign) {
    if (!catalog) return;
    wearDesign(catalog, design.configuration);
    leaveFloor();
    toast.success(`You're wearing the ${design.name.toLowerCase()}.`, {
      description: "Change anything you like, or look around again.",
    });
  }
  const step =
    CUSTOMIZER_STEPS.find((s) => s.code === activeStep) ?? CUSTOMIZER_STEPS[0];
  const nextIndex = STUDIO_STEP_CODES.indexOf(activeStep) + 1;
  const nextStep = CUSTOMIZER_STEPS.find(
    (s) => s.code === STUDIO_STEP_CODES[nextIndex],
  );
  const group =
    activeStep === "fabric"
      ? null
      : catalog.groupsByCode[activeStep as CustomizerGroupCode];

  async function savePhoto() {
    const capture = captureRef.current;
    if (!capture) return;
    const link = document.createElement("a");
    link.href = await capture();
    link.download = `arden-${productSlug}.png`;
    link.click();
  }

  return (
    <div className="suit-atelier" data-mood={mood}>
      <SuitStudioCanvas
        configuration={configuration}
        activeStep={activeStep}
        onSelectStep={selectStep}
        mood={mood}
        turntable={turntable}
        onTurntableStop={stopTurntable}
        insets={panel && panelOpen ? insets : NO_INSETS}
        captureRef={captureRef}
        gallery={gallery}
        view={view}
        inspectedId={inspected?.id ?? null}
        onInspect={inspect}
        onCameraStart={onCameraStart}
        fallback={
          <div className="suit-atelier is-message">
            <EmptyState
              title="3D is unavailable in this browser."
              description="Your selections are saved. Continue in the customizer."
              headingTag="h1"
              action={{ label: "Open the customizer", href: customizeHref }}
            />
          </div>
        }
      />

      <header className="atelier-bar">
        <Link className="atelier-back" href={customizeHref}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Customizer
        </Link>
        <div className="atelier-title">
          <p>{catalog.product.name}</p>
          <p className="atelier-price">
            {formatCurrency(price.totalPriceCents)}
          </p>
        </div>
      </header>

      <div
        className={cn("atelier-tools", !panelOpen && "is-panel-closed")}
        role="toolbar"
        aria-label="Studio tools"
      >
        <div className="atelier-moods" role="group" aria-label="Lighting">
          {(Object.keys(SUIT_MOODS) as SuitMood[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={mood === key}
              onClick={() => setMood(key)}
            >
              {SUIT_MOODS[key].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="atelier-icon-button"
          aria-pressed={turntable}
          aria-label="Turntable"
          title="Turntable"
          onClick={() => {
            if (!turntable) leaveFloor();
            setTurntable((value) => !value);
          }}
        >
          <RotateCw aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          className="atelier-icon-button"
          aria-pressed={floor !== "off"}
          aria-label={floor === "off" ? "Explore the floor" : "Back to my suit"}
          title={floor === "off" ? "Explore the floor" : "Back to my suit"}
          onClick={() =>
            floor === "off" ? enterFloor("overview") : leaveFloor()
          }
        >
          <Compass aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          className="atelier-icon-button"
          aria-label="Save photo"
          title="Save photo"
          onClick={savePhoto}
        >
          <Camera aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          className="atelier-icon-button"
          aria-pressed={!panelOpen}
          aria-label={panelOpen ? "Hide options" : "Show options"}
          title={panelOpen ? "Hide options" : "Show options"}
          onClick={() => setPanelOpen((value) => !value)}
        >
          {panelOpen ? (
            <PanelRightClose aria-hidden="true" className="size-4" />
          ) : (
            <PanelRightOpen aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      {invited || (hint === "found" && floor !== "off") ? (
        <FloorHint
          stage={invited ? "invite" : "found"}
          hasSaved={Boolean(savedDesigns.designs?.length)}
          onShow={() => enterFloor("overview")}
          onDismiss={() => {
            rememberFloorVisit();
            setHint("dismissed");
          }}
        />
      ) : null}

      {panelOpen ? (
        <section
          ref={setPanel}
          className="atelier-panel"
          aria-label="Design options"
        >
          {floor !== "off" ? (
            <FloorPanel
              catalog={catalog}
              designs={galleryDesigns}
              inspected={inspected}
              savedDesigns={savedDesigns}
              onInspect={inspect}
              onWear={wear}
              onLeave={leaveFloor}
            />
          ) : (
            <>
              <nav className="atelier-steps" aria-label="Studio steps">
                {STUDIO_STEP_CODES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-current={code === activeStep ? "step" : undefined}
                    onClick={() => selectStep(code)}
                  >
                    {CUSTOMIZER_STEPS.find((s) => s.code === code)?.shortLabel}
                  </button>
                ))}
              </nav>
              <div className="atelier-panel-heading">
                <h1>
                  {activeStep === "fabric" ? "Choose your cloth" : step.label}
                </h1>
                <p>
                  {STEP_NOTES[activeStep] ??
                    "Click any part of the suit to change it."}
                </p>
              </div>
              <div className="atelier-options">
                {activeStep === "fabric" ? (
                  <FabricStep catalog={catalog} configuration={configuration} />
                ) : group ? (
                  <OptionGroupStep
                    catalog={catalog}
                    configuration={configuration}
                    group={group}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    This section is not available for the selected suit.
                  </p>
                )}
              </div>
              <SpecTicket rows={getSpecTicket(catalog, configuration)} />
              <div className="atelier-panel-actions">
                {nextStep ? (
                  <button
                    type="button"
                    className="atelier-secondary"
                    onClick={() => selectStep(nextStep.code as StudioStepCode)}
                  >
                    Next: {nextStep.shortLabel}
                  </button>
                ) : null}
                <Link
                  className="atelier-primary"
                  href={customizeHref}
                  onClick={() => setStep("tailoring")}
                >
                  Continue to details
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
