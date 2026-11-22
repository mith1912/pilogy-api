import { overallSummaryContentSchema } from "@/lib/validation/overall-summary";
import content from "./overall-summary.vi.json";

export const overallSummaryContent = overallSummaryContentSchema.parse(content);
