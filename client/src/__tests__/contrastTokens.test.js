import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function luminance(hex) {
  const channels = hex.replace("#", "").match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Nivora semantic color contrast", () => {
  it.each([
    ["muted text on warm parchment", "#52656e", "#f7f6f3", 4.5],
    ["primary text on white surface", "#172b35", "#ffffff", 4.5],
    ["placeholder on white input", "#52656e", "#ffffff", 4.5],
    ["supporting text on navy surface", "#cbd5e1", "#0f172a", 4.5],
    ["primary text on deep clinical teal", "#ffffff", "#042f2e", 4.5],
    ["critical text on white surface", "#be123c", "#ffffff", 4.5],
    ["warning amber text on white surface", "#92400e", "#ffffff", 4.5],
    ["success emerald text on white surface", "#065f46", "#ffffff", 4.5],
    ["blue text on white surface", "#1d4ed8", "#ffffff", 4.5],
    ["purple text on white surface", "#6b21a8", "#ffffff", 4.5],
    ["input border on white surface", "#7b8b91", "#ffffff", 3],
    ["focus ring on white surface", "#0f766e", "#ffffff", 3],
  ])("meets WCAG threshold for %s", (_name, foreground, background, minimum) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });

  it("keeps global text/control tokens synchronized with the verified palette", () => {
    const css = readProjectFile("src/index.css");
    const tailwind = readProjectFile("tailwind.config.js");
    expect(css).toContain("--color-muted: #52656e");
    expect(css).toContain("--color-muted-on-dark: #cbd5e1");
    expect(css).toContain("--color-input-border: #7b8b91");
    expect(tailwind).toContain('control: "#7b8b91"');
  });

  it("keeps the patient banner reverse-video with readable IDs and clinical alerts", () => {
    const banner = readProjectFile("src/components/ui/PatientBanner.jsx");
    expect(banner).toContain("from-slate-900 via-teal-950 to-slate-900");
    expect(banner).toContain("text-slate-100 leading-tight");
    expect(banner).toContain("text-slate-300 break-all");
    expect(banner).toContain("text-rose-400");
    expect(banner).toContain("allergies.join");
  });

  it("renders the hospital settings form on white controls without dropping state bindings", () => {
    const settings = readProjectFile("src/pages/admin/HospitalSettingsPage.jsx");
    const controls = settings.match(/<input\b/g) || [];
    const boundValues = settings.match(/value=\{settings\./g) || [];
    expect(controls).toHaveLength(13);
    expect(boundValues).toHaveLength(13);
    expect(settings.match(/bg-white/g).length).toBeGreaterThanOrEqual(13);
    expect(settings).toContain("updateAdminHospitalSettings(settings)");
  });
});
