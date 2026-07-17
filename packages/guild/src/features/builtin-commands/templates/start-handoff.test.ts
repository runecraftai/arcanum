import { describe, it, expect } from "bun:test"
import { START_HANDOFF_TEMPLATE } from "./start-handoff"

describe("START_HANDOFF_TEMPLATE — chooser surface", () => {
	it("contains command-instruction tag", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("<command-instruction>")
		expect(START_HANDOFF_TEMPLATE).toContain("</command-instruction>")
	})

	it("mentions Bard as a routing option", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("Bard")
	})

	it("mentions Wizard as a routing option", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("Wizard")
	})

	it("mentions Fighter as a routing option", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("Fighter")
	})

	it("references planning as Wizard's responsibility", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("planning")
		expect(START_HANDOFF_TEMPLATE).toContain("Wizard")
	})

	it("references execution as Fighter's responsibility", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("execution")
		expect(START_HANDOFF_TEMPLATE).toContain("Fighter")
	})

	it("references delegation as Bard's responsibility", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("delegation")
		expect(START_HANDOFF_TEMPLATE).toContain("Bard")
	})

	it("provides clear routing guidance", () => {
		expect(START_HANDOFF_TEMPLATE).toContain("route")
	})

	it("does not implement work directly", () => {
		expect(START_HANDOFF_TEMPLATE).not.toContain("implement code")
		expect(START_HANDOFF_TEMPLATE).not.toContain("write code")
	})
})
