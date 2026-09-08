import { describe, expect, it } from "vitest";
import { isMediaContentType, orderedMedia } from "./content-media";
describe("content media", () => { it("accepts only configured content types", () => { expect(isMediaContentType("activities")).toBe(true); expect(isMediaContentType("courses")).toBe(false); }); it("puts the selected cover first", () => expect(orderedMedia([{ sortOrder: 0, isCover: false }, { sortOrder: 5, isCover: true }])[0].isCover).toBe(true)); });
