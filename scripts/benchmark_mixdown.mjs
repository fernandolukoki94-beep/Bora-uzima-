import { performance } from "node:perf_hooks";
import { createProject, addClip } from "../src/js/studio/project-model.js";
import { mixTimelineBuffers } from "../src/js/studio/mixdown.js";

const sampleRate = 44100;
const durations = [10, 30, 60, 180, 300];
const results = [];

for (const seconds of durations) {
  const input = new Float32Array(seconds * sampleRate);
  for (let index = 0; index < input.length; index += 1) input[index] = Math.sin(index * 0.02) * 0.12;
  let project = createProject({ id: `benchmark-${seconds}` });
  project = addClip(project, project.tracks[0].id, { id: `clip-${seconds}`, blobKey: `source-${seconds}`, duration: seconds, fadeIn: 0.02, fadeOut: 0.05 });
  const before = process.memoryUsage();
  const started = performance.now();
  const result = mixTimelineBuffers(project, new Map([[`source-${seconds}`, input]]), { sampleRate });
  const elapsedMs = performance.now() - started;
  const after = process.memoryUsage();
  results.push({
    seconds,
    renderMs: Number(elapsedMs.toFixed(2)),
    outputBytes: result.left.length * 4 * 2,
    peak: Number(result.peakAfterHeadroom.toFixed(6)),
    rssDeltaMb: Number(((after.rss - before.rss) / 1024 / 1024).toFixed(2)),
    heapDeltaMb: Number(((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2)),
  });
}
console.log(JSON.stringify({ sampleRate, results }, null, 2));
