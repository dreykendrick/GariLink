import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { GlobalExceptionFilter } from "./global-exception.filter";

describe("GlobalExceptionFilter", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());
  function respond(error: unknown) {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({
          url: "/test?token=secret",
          path: "/test",
          method: "GET",
        }),
      }),
    };
    new GlobalExceptionFilter().catch(error, host as unknown as ArgumentsHost);
    return response.json.mock.calls[0][0];
  }
  it.each([
    new Error("database credentials"),
    new InternalServerErrorException("database credentials"),
  ])("sanitizes unexpected server errors", (error) => {
    const response = respond(error);
    expect(response.statusCode).toBe(500);
    expect(JSON.stringify(response)).not.toContain("credentials");
    expect(response.path).toBe("/test");
  });
  it("keeps actionable validation feedback", () => {
    expect(
      respond(
        new BadRequestException([
          "Phone is required",
          "Code must have 6 digits",
        ]),
      ).message,
    ).toBe("Phone is required; Code must have 6 digits");
  });
});
