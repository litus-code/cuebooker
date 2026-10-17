/** Disconnected PostgreSQL-WASM regression; no hosted credentials or operations. */
import {readFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const {PGlite}=await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db=new PGlite()
await db.exec(`create role anon;create role authenticated;create schema private;
create table public.artists(id uuid primary key);
create table public.organizations(id uuid primary key);
create table public.artist_members(artist_id uuid references public.artists on delete cascade,user_id uuid,role text not null,primary key(artist_id,user_id));
create table public.organization_members(organization_id uuid references public.organizations on delete cascade,user_id uuid,role text not null,primary key(organization_id,user_id));`)
await db.exec(await readFile(new URL('../supabase/migrations/20260914144055_protect_last_owner.sql',import.meta.url),'utf8'))
if(!process.argv.includes('--baseline')) await db.exec(await readFile(new URL('../supabase/migrations/20261016223115_fix_membership_owner_guards.sql',import.meta.url),'utf8'))
let checks=0
for(const [entity,members,column] of [['artists','artist_members','artist_id'],['organizations','organization_members','organization_id']]){
 const parent=crypto.randomUUID(),owner=crypto.randomUUID(),second=crypto.randomUUID(),viewer=crypto.randomUUID()
 await db.query(`insert into public.${entity} values($1)`,[parent])
 await db.query(`insert into public.${members} values($1,$2,'owner'),($1,$3,'member')`,[parent,owner,viewer])
 for(const sql of [`delete from public.${members} where user_id=$1`,`update public.${members} set role='member' where user_id=$1`]){
  await assert.rejects(()=>db.query(sql,[owner]),e=>e.code==='23514' && /must keep at least one owner/.test(e.message));checks++
 }
 await db.query(`insert into public.${members} values($1,$2,'owner')`,[parent,second])
 await db.query(`update public.${members} set role='member' where user_id=$1`,[owner]);checks++
 await db.query(`update public.${members} set role='owner' where user_id=$1`,[owner])
 await db.query(`delete from public.${members} where user_id=$1`,[second]);checks++
 await db.query(`delete from public.${members} where user_id=$1`,[viewer]);checks++
 await db.query(`delete from public.${entity} where id=$1`,[parent])
 assert.equal((await db.query(`select count(*)::int as count from public.${members} where ${column}=$1`,[parent])).rows[0].count,0);checks++
}
for(const fn of ['prevent_last_artist_owner_change','prevent_last_organization_owner_change']){
 for(const role of ['anon','authenticated']){
  assert.equal((await db.query(`select has_function_privilege($1,$2,'EXECUTE') as allowed`,[role,`private.${fn}()`])).rows[0].allowed,false);checks++
 }
}
console.log(JSON.stringify({checks,environment:'isolated PGlite PostgreSQL',cases:'last-owner deletion/demotion denied, second-owner change allowed, ordinary removal, parent cascade, restricted helpers'}))
await db.close()
