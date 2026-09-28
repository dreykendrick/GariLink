import { GetListingUseCase } from "./get-listing.use-case";
import { IListingRepository } from "../../domain/repositories/listing.repository.interface";

describe("Public listing reads", () => {
  function setup(overrides = {}) {
    const listing = {
      id: "listing",
      status: "PUBLISHED",
      deletedAt: null,
      props: { expiresAt: null },
      incrementView: jest.fn(),
      ...overrides,
    };
    const repository = {
      findById: jest.fn().mockResolvedValue(listing),
      incrementViews: jest.fn(),
      save: jest.fn(),
    };
    return {
      repository,
      useCase: new GetListingUseCase(
        repository as unknown as IListingRepository,
      ),
    };
  }
  it.each(["DRAFT", "PAUSED", "ARCHIVED", "EXPIRED", "SOLD"])(
    "does not expose %s listings",
    async (status) => {
      const { useCase, repository } = setup({ status });
      expect((await useCase.execute({ id: "listing" })).isFail).toBe(true);
      expect(repository.incrementViews).not.toHaveBeenCalled();
    },
  );
  it("does not expose soft-deleted listings", async () => {
    expect(
      (
        await setup({ deletedAt: new Date() }).useCase.execute({
          id: "listing",
        })
      ).isFail,
    ).toBe(true);
  });
  it("does not expose expired listings awaiting the expiry worker", async () => {
    expect(
      (
        await setup({ props: { expiresAt: new Date(0) } }).useCase.execute({
          id: "listing",
        })
      ).isFail,
    ).toBe(true);
  });
  it("increments views without overwriting the listing with a stale snapshot", async () => {
    const { useCase, repository } = setup();
    expect((await useCase.execute({ id: "listing" })).isOk).toBe(true);
    expect(repository.incrementViews).toHaveBeenCalledWith("listing");
    expect(repository.save).not.toHaveBeenCalled();
  });
});
