import { describe, expect, it } from "vitest";
import { en } from "./en";
import { ru } from "./ru";
import { uk } from "./uk";
import { detectLanguage, isLanguage, LANGUAGES, translations } from "./index";

describe("locale parity", () => {
  const reference = Object.keys(en).sort();

  for (const [name, dictionary] of [
    ["ru", ru],
    ["uk", uk],
  ] as const) {
    it(`${name} defines exactly the reference keys`, () => {
      // Record<TranslationKey, string> already makes a missing key a compile
      // error; this catches the runtime shape too, and reports which key.
      expect(Object.keys(dictionary).sort()).toEqual(reference);
    });

    it(`${name} has no blank strings`, () => {
      const blank = Object.entries(dictionary)
        .filter(([, value]) => value.trim() === "")
        .map(([key]) => key);

      expect(blank).toEqual([]);
    });

    it(`${name} is actually translated, not copied from English`, () => {
      // Some strings legitimately match ("QR", brand names), so this asserts
      // the bulk differ rather than every single one.
      const identical = Object.keys(en).filter(
        (key) => dictionary[key as keyof typeof en] === en[key as keyof typeof en],
      );

      expect(identical.length).toBeLessThan(reference.length / 2);
    });
  }
});

describe("isLanguage", () => {
  it("accepts the shipped languages and nothing else", () => {
    for (const lang of LANGUAGES) expect(isLanguage(lang)).toBe(true);

    expect(isLanguage("de")).toBe(false);
    expect(isLanguage(null)).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });
});

describe("detectLanguage", () => {
  it("matches on the primary subtag of a full BCP 47 tag", () => {
    expect(detectLanguage("uk-UA")).toBe("uk");
    expect(detectLanguage("ru-RU")).toBe("ru");
    expect(detectLanguage("en-US")).toBe("en");
  });

  it("is case-insensitive", () => {
    expect(detectLanguage("UK-ua")).toBe("uk");
  });

  it("falls back to English for unsupported or missing values", () => {
    expect(detectLanguage("de-DE")).toBe("en");
    expect(detectLanguage(undefined)).toBe("en");
    expect(detectLanguage("")).toBe("en");
  });
});

describe("translations map", () => {
  it("covers every shipped language", () => {
    expect(Object.keys(translations).sort()).toEqual([...LANGUAGES].sort());
  });
});
