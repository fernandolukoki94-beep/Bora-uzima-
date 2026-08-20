import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/js/app.js", import.meta.url), "utf8");

test("AI Producer keeps inline WAV when IndexedDB persistence fails", () => {
  assert.match(appSource, /clip\.audioData = await blobToDataUrl\(wav\);/);
  assert.match(
    appSource,
    /try \{\s*if \(await indexedDbAvailable\(\)\) await putAudioBlob\(nextProject\.id, kind, wav\);\s*\} catch \(error\)/s,
  );
  assert.match(appSource, /WAV instrumental mantido inline; IndexedDB indisponível/);
});

 test("AI Producer no longer aborts the whole materialization on IndexedDB write errors", () => {
  const materializer = appSource.match(/async function materializeInstrumentAudio\(project\) \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.notEqual(materializer, "");
  assert.equal(materializer.includes("await putAudioBlob(nextProject.id, kind, wav);\n    }\n"), false);
  assert.equal(materializer.includes("catch (error)"), true);
});

void assert;
