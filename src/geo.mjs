/** Local Three.js axes: X east, Y elevation, Z south. Coordinates remain in metres. */
export function toWorld(easting, northing, elevation, origin) {
  return [easting - origin.easting, elevation - origin.elevation, origin.northing - northing];
}

/** Reject missing neighbours; a NoData value must never become fabricated ground. */
export function sampleHeight(meta, elevations, valid, easting, northing) {
  const x = (easting-meta.west)/meta.step;
  const y = (meta.north-northing)/meta.step;
  if (x < 0 || y < 0 || x > meta.width-1 || y > meta.height-1) return null;
  const col = Math.min(Math.floor(x), meta.width-2);
  const row = Math.min(Math.floor(y), meta.height-2);
  const a = row*meta.width+col;
  const ids = [a,a+1,a+meta.width,a+meta.width+1];
  if (ids.some(i=>!valid[i])) return null;
  const u = x-col, v = y-row;
  return elevations[a]*(1-u)*(1-v)+elevations[a+1]*u*(1-v)+elevations[a+meta.width]*(1-u)*v+elevations[a+meta.width+1]*u*v;
}

/** Winding produces upward normals. Each triangle independently requires three measured vertices. */
export function terrainIndices(width, height, valid) {
  const indices = [];
  for (let row = 0; row < height-1; row++) for (let col = 0; col < width-1; col++) {
    const a = row*width+col, b = a+1, c = a+width, d = c+1;
    if (valid[a] && valid[c] && valid[b]) indices.push(a,c,b);
    if (valid[b] && valid[c] && valid[d]) indices.push(b,c,d);
  }
  return indices;
}
