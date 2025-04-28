/**
 * Main entry point for REFI-QDA import/export functionality
 */

export * from "./import/index.js";
export * from "./export/index.js";
export * from "./utils/errors.js";

import { exportQDPX } from "./export/index.js";
import { importQDPX } from "./import/index.js";

var imp = await importQDPX("./TestProject.qdpx.zip");
console.log("Imported Project:", JSON.stringify(imp.project.Sources, null, 2));
var res = await exportQDPX(imp.project, "./TestProjectExported.qdpx");
console.log("Exported Project:", JSON.stringify(res, null, 2));
