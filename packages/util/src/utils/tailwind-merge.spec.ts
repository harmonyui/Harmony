import { describe, expect, it } from "vitest";
import { mergeClassesWithScreenSize } from "./tailwind-merge";

describe("tailwind-merge", () => {
  describe("mergeClassesWithScreenSize", () => {
    const expectClassesToBeEqual = (actual: string, expected: string): void => {
      const expectedClasses = expected.split(" ");
      const actualClasses = actual.split(" ");

      expect(actualClasses.length).toBe(expectedClasses.length);
      for (const actualClass of actualClasses) {
        const index = expectedClasses.indexOf(actualClass);
        expect(index).toBeGreaterThanOrEqual(0);
        expectedClasses.splice(index, 1);
      }
    };

    it("Should merge classes with no breakpoints", () => {
      const oldClass = "p-2 ml-3 mb-4 bg-blue-400";
      const newClass = "p-4 mr-2 my-1 hover:bg-yellow-300";
      const screenSize = 1024;
      const merged = mergeClassesWithScreenSize(oldClass, newClass, screenSize);
      expectClassesToBeEqual(
        merged,
        "p-4 ml-3 mr-2 my-1 bg-blue-400 hover:bg-yellow-300",
      );
    });

    it("Should merge classes with existing sm and md breakpoints", () => {
      const oldClass =
        "p-2 sm:p-3 ml-3 md:mb-4 bg-blue-400 sm:hover:bg-red-200";
      const newClass = "p-4 mr-2 my-1 hover:bg-yellow-300";
      const screenSize = 1280;
      const merged = mergeClassesWithScreenSize(oldClass, newClass, screenSize);
      expectClassesToBeEqual(
        merged,
        "p-2 sm:p-4 ml-3 mr-2 md:my-1 bg-blue-400 sm:hover:bg-yellow-300",
      );
    });

    it("Should not merge classes with existing xl breakpoint", () => {
      const oldClass =
        "p-2 sm:p-3 ml-3 md:mb-4 bg-blue-400 xl:hover:bg-red-200";
      const newClass = "p-4 mr-2 my-1 hover:bg-yellow-300";
      const screenSize = 1279;
      const merged = mergeClassesWithScreenSize(oldClass, newClass, screenSize);
      expectClassesToBeEqual(
        merged,
        "p-2 sm:p-4 ml-3 mr-2 md:my-1 bg-blue-400 xl:hover:bg-red-200 hover:bg-yellow-300",
      );
    });

    it("Should not merge classes with existing breakpoints at mobile size", () => {
      const oldClass =
        "p-2 sm:p-3 ml-3 md:mb-4 bg-blue-400 sm:hover:bg-red-200";
      const newClass = "p-4 mr-2 my-1 hover:bg-yellow-300";
      const screenSize = 400;
      const merged = mergeClassesWithScreenSize(oldClass, newClass, screenSize);
      expectClassesToBeEqual(
        merged,
        "p-4 sm:p-3 ml-3 mr-2 my-1 md:mb-4 bg-blue-400 sm:hover:bg-red-200 hover:bg-yellow-300",
      );
    });

    it("Should merge all classes of undefined original class", () => {
      const oldClass = undefined;
      const newClass = "p-4 mr-2 my-1 hover:bg-yellow-300";
      const screenSize = 1960;
      const merged = mergeClassesWithScreenSize(oldClass, newClass, screenSize);
      expectClassesToBeEqual(merged, newClass);
    });

    it("Should merge as 2xl for very big screen size", () => {
      const oldClass =
        "p-2 sm:p-3 ml-3 md:mb-4 bg-blue-400 top-0 2xl:top-10 xl:hover:bg-red-200";
      const newClass = "p-4 mr-2 my-1 hover:bg-yellow-300 top-3";
      const screenSize = 1960;
      const merged = mergeClassesWithScreenSize(oldClass, newClass, screenSize);
      expectClassesToBeEqual(
        merged,
        "p-2 sm:p-4 ml-3 mr-2 md:my-1 bg-blue-400 top-0 xl:hover:bg-yellow-300 2xl:top-3",
      );
    });

    it("Should not put on uneccessary modifier for non trimmed classes", () => {
      const oldClass = " p-2 md:mr-2";
      const newClass = "p-4 mr-1";
      const screenSize = 1960;
      const merged = mergeClassesWithScreenSize(oldClass, newClass, screenSize);
      expectClassesToBeEqual(merged, "p-4 md:mr-1");

      const oldClass2 = " p-2 md:mr-2 ";
      const newClass2 = "p-4 mr-1";
      const merged2 = mergeClassesWithScreenSize(
        oldClass2,
        newClass2,
        screenSize,
      );
      expectClassesToBeEqual(merged2, "p-4 md:mr-1");

      const oldClass3 = "p-2 md:mr-2";
      const newClass3 = " p-4 mr-1";
      const merged3 = mergeClassesWithScreenSize(
        oldClass3,
        newClass3,
        screenSize,
      );
      expectClassesToBeEqual(merged3, "p-4 md:mr-1");
    });
  });
});
