import { describe, it, expect } from "vitest";
import { watcherScope, requestedWatcherDomains } from "@/lib/guardian";

describe("watcherScope — pe materie, nu pe cont", () => {
  const antonia = [
    { domainId: "aviatie", roles: ["ADMIN"] },
    { domainId: "mate", roles: ["WATCHER"] },
    { domainId: "fizica", roles: ["WATCHER", "INSTRUCTOR"] },
  ];
  it("predă → toată materia; doar părinte → doar copiii ei", () => {
    expect(watcherScope(antonia)).toEqual({ teaching: ["aviatie", "fizica"], watchOnly: ["mate"] });
  });
  it("un simplu elev nu vede pe nimeni", () => {
    expect(watcherScope([{ domainId: "mate", roles: ["STUDENT"] }])).toEqual({ teaching: [], watchOnly: [] });
  });
  it("materia din adresă contează doar dacă omul are rol pe ea", () => {
    const s = watcherScope(antonia);
    expect(requestedWatcherDomains(s, "alta-materie")).toEqual({ teaching: [], watchOnly: [] });
    expect(requestedWatcherDomains(s, "mate")).toEqual({ teaching: [], watchOnly: ["mate"] });
    expect(requestedWatcherDomains(s, null)).toEqual(s);
  });
});
