/** Generic evidence intervals: extending a building timeline does not require changing the year UI. */
export function entityAt(data,id,year){
  const states=data.entities[id];
  if(!states)throw new Error('Unknown timeline entity: '+id);
  return [...states].reverse().find(s=>s.fromYear<=year)??{visible:false,variant:'unknown',certainty:'D'};
}
export function chronologyAt(data,year){
  if(!Number.isFinite(year))throw new Error('Invalid year');
  year=Math.max(data.range[0],Math.min(data.range[1],Math.round(year)));
  const milestone=[...data.milestones].reverse().find(m=>m.year<=year);
  const entities=Object.fromEntries(Object.keys(data.entities).map(id=>[id,entityAt(data,id,year)]));
  return {year,milestone,entities,showTown:entities.town.visible,showCanal:entities.canal.visible};
}
