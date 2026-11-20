export type TailoringSpecification = {
  version: 1;
  choices: Record<string, string>;
  dimensions: Record<string, number>;
};

export const TAILORING_AREAS = [
  {
    code: "cloth",
    label: "Cloth & facing",
    description: "Coordinate each garment and its contrasting details.",
  },
  {
    code: "jacket",
    label: "Jacket",
    description: "Shape, construction, pockets, sleeves, and interior.",
  },
  {
    code: "trousers",
    label: "Trousers",
    description:
      "Choose the waist, front, pockets, leg, and hem independently.",
  },
  {
    code: "waistcoat",
    label: "Waistcoat",
    description: "Specify the front, back, pockets, and fastening.",
  },
  {
    code: "finishing",
    label: "Finishing",
    description: "Stitching, buttonholes, embroidery, and formalwear trims.",
  },
  {
    code: "dimensions",
    label: "Dimensions",
    description: "Optional finished-garment targets for a tailor to review.",
  },
] as const;
export type TailoringArea = (typeof TAILORING_AREAS)[number]["code"];
type PrimarySelections = Record<string, string[]>;
type Field = {
  id: string;
  area: TailoringArea;
  label: string;
  options: readonly { value: string; label: string }[];
  preview: "material" | "detail" | "specification";
  previewValues?: readonly string[];
};
function field(
  area: TailoringArea,
  id: string,
  label: string,
  values: string,
  preview: Field["preview"] = "specification",
  previewValues?: readonly string[],
): Field {
  return {
    area,
    id,
    label,
    preview,
    previewValues,
    options: values.split("|").map((entry) => {
      const [value, label] = entry.split(":");
      return { value, label };
    }),
  };
}
const cloth =
  "navy-hopsack:Navy hopsack|grey-traveller:Grey traveller|olive-flannel:Olive flannel|charcoal-pick-and-pick:Charcoal pick-and-pick|midnight-barathea:Midnight barathea|stone-wool-linen:Stone wool-linen";
export const TAILORING_FIELDS: readonly Field[] = [
  field("cloth", "trouser-cloth", "Trouser cloth", cloth, "material"),
  field("cloth", "waistcoat-cloth", "Waistcoat cloth", cloth, "material"),
  field(
    "cloth",
    "lapel-facing",
    "Lapel facing",
    "self:Suit cloth|black-satin:Black satin|midnight-satin:Midnight satin|black-grosgrain:Black grosgrain",
    "material",
  ),
  field(
    "cloth",
    "lining-color",
    "Lining color",
    "navy:Navy|burgundy:Burgundy|ivory:Ivory|black:Black|forest:Forest green",
    "material",
  ),
  field(
    "cloth",
    "lining-material",
    "Lining material",
    "cupro:Cupro|viscose:Viscose|silk:Silk|polyester:Polyester",
  ),
  field(
    "cloth",
    "undercollar",
    "Undercollar",
    "self:Matching|contrast:Contrast felt|cloth:Outer cloth",
  ),
  field(
    "cloth",
    "pattern-matching",
    "Pattern matching",
    "standard:Maker standard|pockets:Match pockets|extended:Match visible seams where construction permits",
  ),
  field(
    "jacket",
    "front-cut",
    "Additional jacket front request",
    "sb-three:Three-button single breasted|three-roll-two:Three-roll-two|db-four:Four-button double breasted|db-six-one:Six-button, one fastening",
    "detail",
    ["db-four"],
  ),
  field(
    "jacket",
    "silhouette",
    "Silhouette",
    "classic:Classic|slim:Slim|relaxed:Relaxed|drape:Drape cut",
  ),
  field(
    "jacket",
    "canvas",
    "Canvas construction",
    "full:Full canvas|half:Half canvas|fused:Fused|unstructured:Unstructured",
  ),
  field(
    "jacket",
    "shoulder",
    "Shoulder construction",
    "natural:Natural|soft:Lightly padded|structured:Structured",
  ),
  field(
    "jacket",
    "sleeve-head",
    "Sleeve head",
    "plain:Plain|roped:Roped|shirt:Shirt shoulder",
  ),
  field(
    "jacket",
    "lapel-width",
    "Lapel width",
    "narrow:Narrow|regular:Regular|wide:Wide",
  ),
  field(
    "jacket",
    "lapel-gorge",
    "Lapel gorge",
    "low:Low|regular:Regular|high:High",
  ),
  field(
    "jacket",
    "lapel-roll",
    "Lapel roll",
    "soft:Soft roll|firm:Defined roll",
  ),
  field(
    "jacket",
    "button-stance",
    "Button stance",
    "low:Lower|regular:Regular|high:Higher",
  ),
  field(
    "jacket",
    "front-quarters",
    "Front quarters",
    "closed:Closed|regular:Regular|open:Open",
  ),
  field(
    "jacket",
    "vents",
    "Back vents",
    "none:No vent|center:Center vent|side:Side vents",
  ),
  field(
    "jacket",
    "breast-pocket",
    "Breast pocket",
    "welt:Straight welt|barchetta:Curved welt|patch:Patch|none:None",
    "detail",
    ["welt", "none"],
  ),
  field(
    "jacket",
    "ticket-pocket",
    "Ticket pocket",
    "none:None|flap:Flap|jetted:Jetted",
  ),
  field(
    "jacket",
    "lining-coverage",
    "Lining coverage",
    "full:Full|half:Half|quarter:Quarter|unlined:Unlined",
  ),
  field(
    "jacket",
    "inside-pockets",
    "Interior pockets",
    "standard:Standard|travel:Travel pockets|minimal:Minimal|none:None",
  ),
  field(
    "jacket",
    "sleeve-lining",
    "Sleeve lining",
    "matching:Match body lining|striped:Striped|plain:Plain contrast",
  ),
  field(
    "jacket",
    "cuff-button-count",
    "Sleeve button count",
    "one:One|two:Two|three:Three|four:Four|five:Five",
    "detail",
    ["one", "two", "three"],
  ),
  field(
    "jacket",
    "cuff-button-spacing",
    "Sleeve button spacing",
    "spaced:Spaced|kissing:Kissing|stacked:Overlapping",
  ),
  field(
    "jacket",
    "working-cuffs",
    "Sleeve buttonholes",
    "working:Working|closed:Closed",
  ),
  field(
    "jacket",
    "sleeve-shape",
    "Sleeve shape",
    "regular:Regular|narrow:Narrow|full:Full",
  ),
  field(
    "trousers",
    "waist-treatment",
    "Waist treatment",
    "side-adjusters:Side adjusters|belt-loops:Belt loops|plain:Plain waistband",
    "detail",
  ),
  field(
    "trousers",
    "pleats",
    "Trouser front",
    "flat:Flat front|single:Single pleat|double:Double pleats",
    "detail",
  ),
  field(
    "trousers",
    "pleat-direction",
    "Pleat direction",
    "forward:Forward|reverse:Reverse",
  ),
  field(
    "trousers",
    "brace-buttons",
    "Brace buttons",
    "none:None|inside:Inside waistband|outside:Outside waistband",
  ),
  field("trousers", "rise", "Rise", "low:Low|regular:Regular|high:High"),
  field(
    "trousers",
    "waistband",
    "Waistband construction",
    "standard:Standard|extended:Extended tab|gurkha:Gurkha wrap|fishtail:Fishtail back",
  ),
  field(
    "trousers",
    "waist-closure",
    "Waist closure",
    "button:Button|hook:Hook and bar|double:Double fastening",
  ),
  field("trousers", "fly", "Fly", "zip:Zipper|button:Buttons"),
  field(
    "trousers",
    "front-pockets",
    "Front pockets",
    "slant:Slanted|seam:Side seam|frog:Frog mouth",
  ),
  field(
    "trousers",
    "back-pockets",
    "Back pockets",
    "two:Two buttoned welts|right:Right pocket only|flap:Flap pockets|none:None",
  ),
  field(
    "trousers",
    "coin-pocket",
    "Coin pocket",
    "none:None|waistband:Waistband|front:Inside front pocket",
  ),
  field(
    "trousers",
    "leg-cut",
    "Leg cut",
    "tapered:Tapered|straight:Straight|wide:Wide",
  ),
  field(
    "trousers",
    "hem",
    "Hem",
    "plain:Plain|turn-up:Turn-ups|unfinished:Unfinished",
  ),
  field(
    "trousers",
    "break",
    "Trouser break",
    "none:No break|slight:Slight break|half:Half break|full:Full break",
  ),
  field(
    "trousers",
    "crease",
    "Leg crease",
    "pressed:Pressed|none:No crease|permanent:Permanent",
  ),
  field(
    "trousers",
    "trouser-lining",
    "Trouser lining",
    "none:None|knee:To the knee|full:Full",
  ),
  field(
    "trousers",
    "heel-guard",
    "Heel guard",
    "yes:With heel guard|no:Without heel guard",
  ),
  field(
    "waistcoat",
    "waistcoat-presence",
    "Include waistcoat",
    "yes:Include a waistcoat|no:No waistcoat",
    "detail",
  ),
  field(
    "waistcoat",
    "waistcoat-front",
    "Waistcoat front",
    "single:Single breasted|double:Double breasted",
  ),
  field(
    "waistcoat",
    "waistcoat-neck",
    "Neckline",
    "v:V neck|u:Low U neck|high:High closing",
  ),
  field(
    "waistcoat",
    "waistcoat-lapel",
    "Waistcoat lapel",
    "none:None|notch:Notch|peak:Peak|shawl:Shawl",
  ),
  field(
    "waistcoat",
    "waistcoat-buttons",
    "Waistcoat button count",
    "four:Four|five:Five|six:Six|eight:Eight",
  ),
  field(
    "waistcoat",
    "waistcoat-pockets",
    "Waistcoat pockets",
    "two:Two welts|four:Four welts|jetted:Jetted|none:None",
  ),
  field(
    "waistcoat",
    "waistcoat-hem",
    "Waistcoat hem",
    "pointed:Pointed|straight:Straight|rounded:Rounded",
  ),
  field(
    "waistcoat",
    "waistcoat-back",
    "Waistcoat back",
    "lining:Lining fabric|self:Outer cloth",
  ),
  field(
    "waistcoat",
    "waistcoat-adjuster",
    "Back adjuster",
    "buckle:Buckle|buttons:Buttons|none:None",
  ),
  field(
    "finishing",
    "pick-stitch",
    "Pick stitching",
    "none:None|edge:At the edge|offset:Offset from the edge",
  ),
  field(
    "finishing",
    "stitch-color",
    "Stitch color",
    "matching:Matching|contrast:Contrast",
  ),
  field(
    "finishing",
    "buttonhole-thread",
    "Buttonhole thread",
    "matching:Matching|ivory:Ivory|burgundy:Burgundy|navy:Navy",
    "detail",
  ),
  field(
    "finishing",
    "lapel-buttonhole",
    "Lapel buttonhole",
    "standard:Standard|milanese:Milanese|none:None",
    "detail",
    ["standard", "none"],
  ),
  field(
    "finishing",
    "cuff-accent",
    "Contrast sleeve buttonhole",
    "none:None|last:Last buttonhole|all:All buttonholes",
  ),
  field(
    "finishing",
    "monogram-position",
    "Monogram position",
    "inside-left:Inside left breast|inside-right:Inside right breast|inside-waistband:Inside waistband",
  ),
  field(
    "finishing",
    "monogram-font",
    "Monogram lettering",
    "block:Block|script:Script",
  ),
  field(
    "finishing",
    "monogram-thread",
    "Monogram thread",
    "matching:Matching|ivory:Ivory|burgundy:Burgundy|gold:Gold",
  ),
  field(
    "finishing",
    "trouser-braid",
    "Formal trouser braid",
    "none:None|satin:Satin|grosgrain:Grosgrain",
  ),
];

export const TAILORING_DIMENSIONS = [
  { id: "lapel-width-cm", label: "Lapel width", max: 20 },
  { id: "jacket-length-cm", label: "Jacket length", max: 120 },
  { id: "jacket-chest-cm", label: "Jacket chest circumference", max: 200 },
  { id: "jacket-waist-cm", label: "Jacket waist circumference", max: 200 },
  { id: "shoulder-width-cm", label: "Shoulder width", max: 80 },
  { id: "left-sleeve-cm", label: "Left sleeve length", max: 100 },
  { id: "right-sleeve-cm", label: "Right sleeve length", max: 100 },
  { id: "trouser-waist-cm", label: "Trouser waist circumference", max: 200 },
  { id: "trouser-seat-cm", label: "Trouser seat circumference", max: 200 },
  { id: "front-rise-cm", label: "Front rise", max: 60 },
  { id: "back-rise-cm", label: "Back rise", max: 70 },
  { id: "thigh-cm", label: "Thigh circumference", max: 100 },
  { id: "knee-cm", label: "Knee circumference", max: 80 },
  { id: "hem-width-cm", label: "Hem width, laid flat", max: 50 },
  { id: "inseam-cm", label: "Inseam", max: 130 },
  { id: "outseam-cm", label: "Outseam", max: 160 },
  { id: "turn-up-cm", label: "Turn-up depth", max: 10 },
  { id: "waistcoat-length-cm", label: "Waistcoat back length", max: 100 },
] as const;

export function emptyTailoring(): TailoringSpecification {
  return { version: 1, choices: {}, dimensions: {} };
}

export function tailoringDisabledReason(
  id: string,
  spec: TailoringSpecification,
  primary: PrimarySelections,
): string | null {
  if (
    id.startsWith("waistcoat-") &&
    id !== "waistcoat-presence" &&
    !(spec.choices["waistcoat-presence"]
      ? spec.choices["waistcoat-presence"] === "yes"
      : primary.extras?.includes("matching-waistcoat"))
  )
    return "Include a waistcoat first.";
  if (
    id.startsWith("monogram-") &&
    !primary.extras?.includes("personal-monogram")
  )
    return "Add a personal monogram in Extras first.";
  if (
    id === "pleat-direction" &&
    !(spec.choices.pleats
      ? spec.choices.pleats !== "flat"
      : primary.trousers?.includes("single-pleat-trousers"))
  )
    return "Choose single or double pleats first.";
  if (id === "turn-up-cm" && spec.choices.hem !== "turn-up")
    return "Choose turn-ups first.";
  return null;
}

export function normalizeTailoring(
  spec: TailoringSpecification | undefined,
  primary: PrimarySelections,
): TailoringSpecification | undefined {
  if (!spec) return undefined;
  return {
    version: 1,
    choices: Object.fromEntries(
      TAILORING_FIELDS.flatMap((f) => {
        const value = spec.choices[f.id];
        return f.options.some((o) => o.value === value) &&
          !tailoringDisabledReason(f.id, spec, primary)
          ? [[f.id, value]]
          : [];
      }),
    ),
    dimensions: Object.fromEntries(
      TAILORING_DIMENSIONS.flatMap((f) => {
        const value = spec.dimensions[f.id];
        return Number.isFinite(value) &&
          value > 0 &&
          value <= f.max &&
          !tailoringDisabledReason(f.id, spec, primary)
          ? [[f.id, value]]
          : [];
      }),
    ),
  };
}

export function tailoringValidationError(
  spec: TailoringSpecification | undefined,
  primary: PrimarySelections,
): string | null {
  if (!spec) return null;
  if (spec.version !== 1 || !spec.choices || !spec.dimensions)
    return "Invalid tailoring specification.";
  for (const [id, value] of Object.entries(spec.choices)) {
    const f = TAILORING_FIELDS.find((f) => f.id === id);
    if (!f || !f.options.some((o) => o.value === value))
      return `Unknown tailoring choice: ${id}.`;
    const reason = tailoringDisabledReason(id, spec, primary);
    if (reason) return reason;
  }
  for (const [id, value] of Object.entries(spec.dimensions)) {
    const f = TAILORING_DIMENSIONS.find((f) => f.id === id);
    if (!f || !Number.isFinite(value) || value <= 0 || value > f.max)
      return `Invalid garment dimension: ${id}.`;
    const reason = tailoringDisabledReason(id, spec, primary);
    if (reason) return reason;
  }
  return null;
}

export function hasTailoringRequests(spec: TailoringSpecification | undefined) {
  return Boolean(
    spec &&
    (Object.keys(spec.choices).length || Object.keys(spec.dimensions).length),
  );
}

export function tailoringRows(spec: TailoringSpecification | undefined) {
  if (!spec) return [];
  return [
    ...TAILORING_FIELDS.flatMap((f) => {
      const option = f.options.find((o) => o.value === spec.choices[f.id]);
      return option
        ? [
            {
              id: f.id,
              label: f.label,
              value: option.label,
              preview:
                f.previewValues && !f.previewValues.includes(option.value)
                  ? ("specification" as const)
                  : f.preview,
            },
          ]
        : [];
    }),
    ...TAILORING_DIMENSIONS.flatMap((f) =>
      spec.dimensions[f.id] === undefined
        ? []
        : [
            {
              id: f.id,
              label: f.label,
              value: `${spec.dimensions[f.id]} cm`,
              preview: "specification" as const,
            },
          ],
    ),
  ];
}

export function tailoringSignature(spec: TailoringSpecification | undefined) {
  if (!hasTailoringRequests(spec)) return "";
  return `|tailoring-v1:${JSON.stringify([Object.entries(spec!.choices).sort(([a], [b]) => a.localeCompare(b)), Object.entries(spec!.dimensions).sort(([a], [b]) => a.localeCompare(b))])}`;
}
