import { validateSync } from "class-validator";
import { CompleteProfileDto } from "./identity.dto";

describe("Profile input validation", () => {
  it("accepts international names and valid optional profile fields", () => {
    const dto = Object.assign(new CompleteProfileDto(), {
      firstName: "Juma",
      lastName: "Rashid",
      displayName: "Juma Motors",
      city: "Dar es Salaam",
      bio: "Vehicle owner",
    });
    expect(validateSync(dto)).toEqual([]);
  });
  it("rejects oversized profile fields", () => {
    const dto = Object.assign(new CompleteProfileDto(), {
      firstName: "a".repeat(81),
      bio: "a".repeat(501),
    });
    expect(validateSync(dto).map((error) => error.property)).toEqual([
      "firstName",
      "bio",
    ]);
  });
  it("rejects invalid dates and unsupported gender values before persistence", () => {
    const dto = Object.assign(new CompleteProfileDto(), {
      dateOfBirth: "not-a-date",
      gender: "invalid",
    });
    expect(validateSync(dto).map((error) => error.property)).toEqual([
      "dateOfBirth",
      "gender",
    ]);
  });
});
